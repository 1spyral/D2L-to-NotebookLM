export default {
  darkMode: "class",
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light — Material 3 baseline
        surface: "#e8eaf6", // page bg
        surfaceDim: "#dde0f5", // slightly darker page
        container: "#ffffff", // card surface
        containerLow: "#eef1ff", // tonal container
        outline: "#c7cad8", // subtle divider
        outlineFocus: "#1a73e8", // focus ring
        ink: "#1a1c2b", // on-surface
        muted: "#5b5e72", // on-surface-variant
        mutedSoft: "#8e92a8", // placeholder
        primary: "#1a73e8", // Google blue
        primaryHov: "#1765cc", // hovered blue
        primaryCont: "#d3e3fd", // primary container (tonal)
        onPrimary: "#ffffff",
        success: "#1e8e3e",
        successCont: "#d8f5e3",
        error: "#c5221f",
        errorCont: "#fce8e6",
        // Dark — Material 3 dark scheme
        dkSurface: "#131318",
        dkSurfaceDim: "#1c1b22",
        dkContainer: "#1e1e26",
        dkContLow: "#282835",
        dkOutline: "#44475a",
        dkInk: "#e4e1ec",
        dkMuted: "#918f9f",
        dkPrimary: "#aac7ff",
        dkPrimaryHov: "#c2d7ff",
        dkPrimCont: "#0842a0",
        dkSuccess: "#6dd58c",
        dkSuccessCont: "#0d3b1f",
        dkError: "#f28b82",
        dkErrorCont: "#601410",
      },
      boxShadow: {
        elev1: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        elev2: "0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
        elev3: "0 8px 24px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.07)",
        btn: "0 1px 3px rgba(26,115,232,0.30)",
        btnHov: "0 4px 12px rgba(26,115,232,0.35)",
      },
      borderRadius: {
        card: "18px",
        pill: "100px",
        item: "10px",
        chip: "8px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.4px" }],
        "label-md": ["11px", { lineHeight: "14px", letterSpacing: "0.4px" }],
        "body-sm": ["12px", { lineHeight: "17px" }],
        "body-md": ["13px", { lineHeight: "18px" }],
        "title-sm": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "title-md": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "title-lg": ["16px", { lineHeight: "22px", fontWeight: "500" }],
        headline: ["18px", { lineHeight: "24px", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};
