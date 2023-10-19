# Livecanvas

A Signed Distance Field art tool built with Elixir, WebGL, and LiveView.

[Signed Distance Fields](https://iquilezles.org/articles/distfunctions/) and the operations you can perform on them allow you to create complex and cool shapes which make for really cool art pieces. Somehow graphics programmers figured out you could do geometry by calculating distances from every vector in a shader and it just workls.

This is a full on port from the incredible [SDFX](https://github.com/adam-james-v/sdfx) by Adam James. I wanted to learn more about SDFs and WebGL, so I decided to port it to Elixir and LiveView and learn along the way. The shader and geometry code is mostly a direct port with some changes to make it work in Elixir. The monaco and backend/compiling steps are mine though.

## Limitations

Currently best to run it only locally. It does attempt to make the [safeish](https://github.com/robinhilliard/safeish) to run by limiting your code to the following list:`Livecanvas.Geometry, Enum, Range, Access, Map, MapSet, String, Float, Integer, Stream` but its not safe for production use.

## Examples

```elixir
a = sphere(90)
    |> onion(10)

b = smooth_difference(30, box(120, 30, 120),  a)

c = smooth_intersection(11, b, box(30, 130, 130))

paren = difference(box(50, 50, 130), c)
|> slices(10, 1)
```
[[/example.png|Image of 2 circles sliced into wedges]]

The geometry code is in `lib/livecanvas/geometry.ex` and is partially broken for some functions. Elixir doens't really have partial application I ended up doing term rewriting. I probably could have done this cleaner with a macro but this works.

## Running Locally
To start you need elixir ~1.15 and erlang ~otp-26:

  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.
