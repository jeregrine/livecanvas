defmodule LivecanvasWeb.EditorLive do
  use LivecanvasWeb, :live_view
  @default_code "\n\n"

  def mount(_params, _session, socket) do
    {:ok,
     assign(socket,
       code: @default_code
     )}
  end

  def render(assigns) do
    ~H"""
    <div class="flex w-full h-full bg-black pt-3">
      <div
        id="code-editor"
        class="flex-initial w-1/3 h-screen"
        phx-hook="CodeEditor"
        phx-update="ignore"
        data-language="elixir"
        data-code={@code}
      >
        <div class="w-full h-full" data-el-code-editor />
      </div>
      <div class="flex h-screen text-white">
        <canvas
          id="canvas"
          phx-hook="Canvas"
          width="1400"
          height="1400"
          style="width: 700px; height: 700px"
        >
        </canvas>
      </div>
    </div>
    """
  end
end
