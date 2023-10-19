defmodule Livecanvas.Geometry do
  @scale 0.01
  def sphere(acc \\ :none, radius) do
    r = radius * @scale

    {"sdSphere", acc, [r]}
  end

  def box(acc \\ :none, l, w, h) do
    l = l * @scale
    w = w * @scale
    h = h * @scale

    {"sdBox", acc, [vec_str([l, w, h])]}
  end

  def circle(acc \\ :none, radius) do
    r = radius * @scale

    {"sdCircle", acc, [r]}
  end

  @doc """
    Defines a line segment starting at point a and ending at point b.
    Points can be 2D or 3D.
  """
  def line(acc \\ :none, a, b) do
    a = Enum.map(a, fn x -> x * @scale end)
    b = Enum.map(b, fn x -> x * @scale end)

    {"sdLine", acc, [vec_str(a), vec_str(b)]}
  end

  @doc """
    Defines a 3D shape by 'pulling' the 2D `shape` along the Z axis up to the given height `h`.
  """
  def extrude(acc \\ :none, shape, h) do
    h = h * @scale
    # TODO Broken
    {"opExtrude", :na, [rewrite(shape, acc), h]}
  end

  @doc """
    Defines a 3D shape by 'pulling' the 2D `shape` around the Y axis.
  """
  def revolve(acc \\ :none, shape) do
    rewrite(shape, {"opRevolve", acc, []})
  end

  @doc "Creates a shell of `f` with thickness `t`."
  def onion(acc \\ :none, f, t) do
    t = t * @scale
    {"opOnion", :na, [rewrite(f, acc), t]}
  end

  def union(acc \\ :none, fa, fb) do
    {"opUnion", :na, [rewrite(fa, acc), rewrite(fb, acc)]}
  end

  @doc "Defines the shared shape of `fa` and `fb`."
  def intersection(acc \\ :none, fa, fb) do
    {"opIntersection", :na, [rewrite(fa, acc), rewrite(fb, acc)]}
  end

  @doc "Defines the cut shape of `fa` and `fb` where `fa` is removed."
  def difference(acc \\ :none, fa, fb) do
    {"opDifference", :na, [rewrite(fa, acc), rewrite(fb, acc)]}
  end

  @doc """
    Translates the given shape function `f` by [`x` `y` `z`] or by [`x` `y`] if the shape function is a 2D shape.
  """
  def translate(acc \\ :none, f, a)

  def translate(acc, f, {x, y, z}) do
    x = x * @scale
    y = y * @scale
    z = z * @scale

    rewrite(f, {"opTranslate", acc, [vec_str([x, y, z])]})
  end

  def translate(acc, f, {x, y}) do
    x = x * @scale
    y = y * @scale
    rewrite(f, {"opTranslate", acc, [vec_str([x, y])]})
  end

  @doc """
    Rotates the given shape function `f` by rotations `rs`, which is a vector of [`rx` `ry` `rz`] for 3D shapes and a number in degress for 2D shapes.
    The order of 3D rotations matters and will occurs as follows:
     - `rz` is the rotation around the Z axis towards the Y+ axis.
     - `ry` is the rotation around the Y axis towards the X+ axis.
     - `rx` is the rotation around the Y axis towards the Z+ axis.
  """
  def rotate(acc \\ :none, f, a)

  def rotate(acc, f, {rx, ry, rz}) do
    rewrite(f, {"opRotate", acc, [vec_str([rx, ry, rz])]})
  end

  def rotate(acc, f, r) when is_number(r) do
    rewrite(f, {"opRotate", acc, [r * 1.0]})
  end

  @doc """
  "Defines the joined shape of `fa` and `fb` with a smoothing factor `k`.
  A `k` factor of 0 causes the equivalent of a standard `union`."
  """
  def smooth_union(_acc \\ :none, _k, fa), do: fa

  def smooth_union(acc, k, fa, fb) do
    k = k * @scale
    {"opSmoothUnion", :na, [rewrite(fa, acc), rewrite(fb, acc), k]}
  end

  @doc """
  Defines the cut shape of `fa` and `fb` where `fa` is removed with a smoothing factor `k`.
  A `k` factor of 0 causes the equivalent of a standard `difference`.
  """
  def smooth_difference(acc \\ :none, k, fa, fb) do
    k = k * @scale
    {"opSmoothDifference", :na, [rewrite(fa, acc), rewrite(fb, acc), k]}
  end

  @doc """
  Defines the shared shape of `fa` and `fb` with a smoothing factor `k`.
  A `k` factor of 0 causes the equivalent of a standard `intersection`.
  """
  def smooth_intersection(acc \\ :none, k, fa, fb) do
    k = k * @scale
    {"opSmoothIntersection", :na, [rewrite(fa, acc), rewrite(fb, acc), k]}
  end

  @doc """
    Infinitely repeats the SDF `f` according to the spacing vector `s`, which indicates spacing along [x y z] axes.
  """
  def repeat_shape(acc \\ :none, f, s) do
    rewrite(f, {"opRepetition", acc, [vec_str(s)]})
  end

  @doc """
    Slices the shape `shape` leaving slices of `thickness` spaced according to `spacing`.
  """
  def slices(acc \\ :none, shape, spacing, thickness) do
    s = spacing * @scale
    t = thickness * @scale

    sl =
      box(100_000, 100_000, (s - t) * (1.0 / @scale))
      |> repeat_shape([0.0, 0.0, s * 2])

    difference(acc, sl, shape)
  end

  @doc """
    Slices the onioned shape `shape` leaving rings of `thickness` spaced according to `spacing`.
  """
  def rings(acc \\ :none, shape, spacing, thickness) do
    s = spacing * @scale
    t = thickness * @scale

    sl =
      box(100_000, 100_000, (s - t * @scale) * (1.0 / @scale))
      |> repeat_shape([0.0, 0.0, s * 2])

    d = difference(sl, onion(shape, t * 0.25))

    smooth_union(t * 2, acc, d)
  end

  defp vec_str(v) when is_tuple(v) do
    Tuple.to_list(v)
    |> vec_str()
  end

  defp vec_str(v) when is_list(v) do
    str =
      v
      |> Enum.map(&str/1)
      |> Enum.join(", ")

    count = length(v)
    "vec#{count}(#{str})"
  end

  defp str(n) when is_float(n) do
    :erlang.float_to_binary(n, [{:decimals, 5}, :compact])
  end

  defp str(n) when is_integer(n), do: str(1.0 * n)

  defp rewrite({op, :na, args}, acc) do
    {op, :na, Enum.map(args, fn a -> rewrite(a, acc) end)}
  end

  defp rewrite({op, :none, args}, acc) do
    {op, acc, args}
  end

  defp rewrite(a, _), do: a

  def compile({op, :none, args}) do
    "#{op}(p, #{Enum.join(args, ", ")})"
  end

  def compile({op, :na, args}) do
    args =
      args
      |> Enum.map(&compile/1)
      |> Enum.join(",")

    "#{op}(#{args})"
  end

  def compile({op, c, args}) do
    args =
      args
      |> Enum.map(&compile/1)
      |> Enum.join(",")

    c = compile(c)

    "#{op}(#{c}, #{args})"
  end

  def compile(a), do: a
end
