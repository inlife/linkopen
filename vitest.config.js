import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            utils: path.resolve(__dirname, 'utils/'),
        },
    },
    // Components are .js files with JSX
    esbuild: { include: /\.js$/, exclude: [], loader: 'jsx', jsx: 'automatic' },
    test: {
        // components/site-analytics.test.js mocks next/navigation inside this package
        server: { deps: { inline: ['@vercel/analytics'] } },
    },
})
