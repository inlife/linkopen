import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            utils: path.resolve(__dirname, 'utils/'),
        },
    },
    test: {
        // utils/analytics.test.js mocks next/navigation inside this package
        server: { deps: { inline: ['@vercel/analytics'] } },
    },
})
