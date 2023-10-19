import * as monaco from "monaco-editor";
import * as dark from "./themes/flexoki-dark.json";
import * as light from "./themes/flexoki-light.json";

const CodeEditor = {
  mounted() {
    self.MonacoEnvironment = {
      globalAPI: true,
      getWorkerUrl(_workerId, _label) {
        return "/assets/monaco-editor/editor/editor.worker.js";
      },
    };

    const container = this.el.querySelector("[data-el-code-editor]");
    const { language, code } = this.el.dataset;

    monaco.editor.defineTheme("dark", dark);
    monaco.editor.defineTheme("light", light);
    let savedCode = window.localStorage.getItem("code");
    if (savedCode != null) this.pushEvent("code-change", { code: savedCode });

    this.editor = monaco.editor.create(container, {
      language: language,
      theme: "dark",
      fontSize: 14,
      value: savedCode || code,
      minimap: {
        enabled: false,
      },
      // ... other options
    });
    this.editor.getModel().onDidChangeContent(() => {
      window.localStorage.setItem("code", this.editor.getValue());
      this.pushEvent("code-change", { code: this.editor.getValue() });
    });

    window.addEventListener("resize", () => {
      window.requestAnimationFrame(() => {
        const rect = this.el.getBoundingClientRect();
        this.editor.layout({ width: rect.width, height: rect.height });
      });
    });
  },

  destroyed() {
    if (this.editor) this.editor.dispose();
  },
};

export default CodeEditor;
