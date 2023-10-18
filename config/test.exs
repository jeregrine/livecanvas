import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :livecanvas, LivecanvasWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "ApMWUlL4XQutySb/pQlSyap2lABuPNvs1lYpikz4vvnJsp9/r42OMEtuQMw8sGnC",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
