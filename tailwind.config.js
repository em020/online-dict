module.exports = {
    content: [
        './src/dicts/networktest/**/*.{ts,tsx}',
    ],
    prefix: 'nt-',
    important: '.networktest-Container',
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {},
    },
    plugins: [],
}
