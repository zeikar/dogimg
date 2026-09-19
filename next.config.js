/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next dev` would otherwise write its own block into AGENTS.md whenever it
  // runs under a coding agent. That file is maintained by hand here, and it
  // already points at the bundled docs.
  agentRules: false,
}

module.exports = nextConfig
