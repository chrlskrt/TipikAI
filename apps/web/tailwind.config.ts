import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            borderRadius: {
                lg: "0rem",
                md: "0rem",
                sm: "0rem",
                DEFAULT: "0rem",
                full: "0rem",
                xl: "0rem",
                "2xl": "0rem",
                "3xl": "0rem",
            },
            colors: {
                discord: {
                    bg: "#5865F2", // Blurple
                    dark: "#36393f", // Main
                    darker: "#2f3136", // Sidebar
                    darkest: "#202225", // Nav/Input
                    text: "#dcddde",
                    header: "#ffffff",
                    success: "#3ba55c",
                    danger: "#ed4245",
                    hover: "#40444b",
                },
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-out forwards",
                "slide-up": "slideUp 0.4s ease-out forwards",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
