defmodule LivecanvasWeb.EditorLive do
  use LivecanvasWeb, :live_view

  @code_imports "import Elixir.Livecanvas.Geometry"
  @default_code "sphere(20)"
  @code_footer "|> compile()"

  def mount(_params, _session, socket) do
    settings = %{"colors" => "normals", "outlines" => false}
    form = to_form(settings, as: "settings")

    {:ok,
     assign(socket,
       form: form,
       settings: settings,
       code: "",
       compiled: "",
       editor_id: RandomString.len(100) |> String.capitalize()
     )}
  end

  def handle_event("error", %{"error" => msg}, socket) do
    {:noreply, put_flash(socket, :error, msg)}
  end

  def handle_event("code-change", %{"code" => code}, socket) do
    case compile_code(code, socket.assigns.editor_id) do
      {:ok, compiled} ->
        {:noreply,
         socket
         |> clear_flash()
         |> assign(:compiled, compiled)}

      {:error, error} ->
        {:noreply, put_flash(socket, :error, Exception.message(error))}
    end
  end

  def handle_event("settings", %{"settings" => settings}, socket) do
    {:noreply,
     socket
     |> assign(:settings, settings)
     |> assign(:form, to_form(settings, as: "settings"))}
  end

  defp compile_code(code, id) do
    try do
      code = String.trim(code)

      module = Module.concat([:Livecanvas, :Editor, id])

      mod = """
        defmodule #{module} do
          import Elixir.Livecanvas.Geometry
          def go() do
            #{code}
            |> compile()
          end
        end
      """

      [{mod, bytecode}] = Code.compile_string(mod)

      {:ok, mod} =
        Safeish.load_bytecode(bytecode, [
          Livecanvas.Geometry,
          Enum,
          Range,
          Access,
          Map,
          MapSet,
          String,
          Float,
          Integer,
          Stream
        ])

      {:ok, mod.go()}
    rescue
      error ->
        {:error, error}
    end
  end

  def render(assigns) do
    ~H"""
    <div class="flex w-full h-full bg-black pt-3 overflow-hidden">
      <div
        id="code-editor"
        class="flex w-1/2 h-screen"
        phx-hook="CodeEditor"
        phx-update="ignore"
        data-language="elixir"
        data-code={@code}
      >
        <div class="w-full h-full" data-el-code-editor />
      </div>
      <div class="flex w-1/2 h-screen text-white overflow-hidden relative">
        <canvas
          data-sdf={@compiled}
          data-colors={@settings["colors"]}
          data-outlines={to_string(@settings["outlines"])}
          id="canvas"
          phx-hook="Canvas"
          width="1400"
          height="1400"
          style="width: 700px; height: 700px"
        >
        </canvas>

        <.form
          for={@form}
          class="fixed t-0 l-0 text-white flex flex-row space-x-4 items-center"
          phx-change="settings"
          phx-submit="settings"
        >
          <.input field={@form[:outlines]} label="Outlines" type="checkbox" />
          <!-- <.input
            field={@form[:colors]}
            options={[{"Countours", "countours"}, {"Normals", "normals"}]}
            label="Colors"
            type="select"
          />-->
        </.form>
      </div>
    </div>
    """
  end
end

defmodule RandomString do
  @alphabet Enum.concat([?A..?Z, ?a..?z])

  def len(count) do
    # Technically not needed, but just to illustrate we're
    # relying on the PRNG for this in random/1
    :rand.seed(:exsplus, :os.timestamp())

    Stream.repeatedly(&random_char_from_alphabet/0)
    |> Enum.take(count)
    |> List.to_string()
  end

  defp random_char_from_alphabet() do
    Enum.random(@alphabet)
  end
end
