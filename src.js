(() => {
  // Configuration
  const Config = {
    ExtensionName: "bruno-extension-copy-network-logs-and-response",
    setSeparator: "",

    hideConnectionProcessDetails: true,
    maskingLogFiledRegex: /([Cc]ookie:|[Aa]uthorization: Bearer|access_token|refresh_token|client_secret)(.*)/g,

    waitTimeForInitialization: 3000,
    buttonPosition: "Safe Mode",
    buttonText: "Copy",
  };

  // Utility functions
  const Utils = {
    // Wait for specified time
    wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

    appendCss: cssDefinition => {
      if (Array.from(document.querySelectorAll('style')).some(style => style.innerHTML === cssDefinition)) return;
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = cssDefinition;
      document.head.appendChild(style);
    },

    formatDate: date => {
      const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const d = new Date(date);
      const pad = num => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${weekday[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },

    maskSensitiveInfo: text => text.replaceAll(Config.maskingLogFiledRegex, "$1 ****")
  };

  // DOM operation functions
  const DomOperations = {
    clickElement: async ({ selector, xpath, getTarget }) => {
      try {
        let el = null;
        if (selector) {
          el = document.querySelector(selector);
        } else if (xpath) {
          el = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
        }
        if (getTarget && el) el = getTarget(el);
        el?.click();
        return !!el;
      } catch (e) {
        console.error("Failed to click element:", e);
        return false;
      }
    },

    clickNetworkLogs: async () =>
      DomOperations.clickElement({
        xpath: '//*[not(contains(name(), "script")) and text() = "Network Logs"]'
      }),

    clickNetworkLogsPreviousElement: async () =>
      DomOperations.clickElement({
        xpath: '//*[not(contains(name(), "script")) and text() = "Network Logs"]',
        getTarget: el => el.previousSibling
      }),

    insertElementAtPosition: (element, referenceText) => {
      try {
        const node = document.evaluate('//*[not(contains(name(), "script")) and contains(text(), "' + referenceText + '")]',
          document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
        if (node?.parentNode) {
          node.parentNode.insertBefore(element, node.nextSibling);
          return true;
        }
      } catch (e) { console.error("Failed to insert element:", e); }
      return false;
    }
  };

  // Data processing functions
  const DataProcessor = {
    getNetworkLogs: async () => {
      return Array.from(document.getElementsByClassName("whitespace-pre-wrap")[0].children)
        .map(e => e.className + "@@@@" + e.textContent)
        //.map(t => t.startsWith("text-yellow") ? t.replace(/text-yellow-[0-9]*@@@@/g, "+ ") : t)
        //.map(t => t.startsWith("text-purple") ? t.replace(/text-purple-[0-9]*@@@@/g, "* ") : t)
        .map(t => t.startsWith("text-yellow-500@@@@Current time is") ? "Current time is " + Utils.formatDate(t.replace("text-yellow-500@@@@Current time is ", "")) : t)
        .map(t => t.startsWith("text-yellow") ? "" : t)
        .map(t => t.startsWith("text-purple") ? "" : t)
        .map(t => t.startsWith("text-blue")   ? t.replace(/text-blue-[0-9]*@@@@/g, "") : t)
        .map(t => t.startsWith("text-gray")   ? t.replace(/text-gray-[0-9]*@@@@/g, "") : t)
        .map(t => t.startsWith("text-green")  ? t.replace(/text-green-[0-9]*@@@@/g, "") : t)
        .filter(t => t !== "> ")
        .filter(t => t !== "")
        .map(t => t.startsWith("mt-4") ? "" : t)
        .join("\n")
        .replace(/^\n/, "");
    },

    copyToClipboard: result => {
      return new Promise((resolve, reject) => {
        try {
          navigator.clipboard.writeText(Utils.maskSensitiveInfo(result.value));
          resolve(result);
        } catch (e) {
          console.error("Failed to copy to clipboard:", e);
          reject(e);
        }
      });
    },
  };

  const createCopyButton = () => {
    const copyButton = document.createElement("div");

    // Define CSS
    Utils.appendCss(`
      .${Config.ExtensionName}-icon {
        box-sizing: border-box;
        display: inline-block;
        font-size: inherit;
        font-style: normal;
        height: 1em;
        position: relative;
        text-indent: -9999px;
        vertical-align: middle;
        width: 1em;
      }
      
      .${Config.ExtensionName}-icon::before,
      .${Config.ExtensionName}-icon::after {
        content: "";
        display: block;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .${Config.ExtensionName}-icon-copy::before {
        border: .1rem solid currentColor;
        border-bottom-color: transparent;
        border-radius: .1em;
        border-right-color: transparent;
        height: .8em;
        left: 40%;
        top: 40%;
        width: .7em;
      }
      
      .${Config.ExtensionName}-icon-copy::after {
        border: .1rem solid currentColor;
        border-radius: .1em;
        height: .8em;
        left: 60%;
        top: 60%;
        width: .7em;
      }
    `);

    // Create button element
    copyButton.style.cssText = "display: flex;";
    copyButton.innerHTML = `
    <button style="margin-left: 5px;padding: 2px 10px 2px 10px;color: #FFF;background: rgb(130 130 130 / 35%); display: flex; justify-content: center; align-items: center;">
      <div class="${Config.ExtensionName}-icon ${Config.ExtensionName}-icon-copy" style="margin: 2px 5px 0px 3px"></div>
      <div style="display: flex; justify-content: center; align-items: center;">${Config.buttonText}</div>
    </button>
    `;

    // Data collection process
    const processData = async () => {
      try {
        const result = { value: "" };

        // Click Network Logs and get its content
        await DomOperations.clickNetworkLogs();
        await Utils.wait(100);
        const networkLogs = await DataProcessor.getNetworkLogs();

        // Click Response and get its content
        await DomOperations.clickNetworkLogsPreviousElement();
        await Utils.wait(100);
        const responseBody = document.getElementsByClassName("collapsible-section")[1]?.querySelector(".CodeMirror")?.CodeMirror?.getValue() || "";

        result.value += networkLogs + "\n" + responseBody + "\n";
        result.value = result.value.replace(/\n{3,}/g, '\n\n');

        // Execute copy
        await DataProcessor.copyToClipboard(result);
        console.log("Copying data completed");
      } catch (e) {
        console.error("Data collection process failed:", e);
      }
    };

    // Set click event
    copyButton.addEventListener("click", processData);

    // Place button
    DomOperations.insertElementAtPosition(copyButton, Config.buttonPosition);

    return copyButton;
  };

  // Initialize the Extension
  setTimeout(() => {
    try {
      createCopyButton();
      console.log(`${Config.ExtensionName} extension has just been initialized`);
    } catch (e) {
      console.error(`${Config.ExtensionName} extension initialization failed:`, e);
    }
  }, Config.waitTimeForInitialization);

})();
