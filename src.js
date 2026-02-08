(() => {
  // Configuration
  const Config = {
    ExtensionName: "bruno-userscript-copy-button",
    setSeparator: "",

    includeApplicationMessage: false,
    includeConnectionProcessDetails: false,
    maskingLogFieldRegex: /([Cc]ookie:|[Aa]uthorization: Bearer|access_token|refresh_token|client_secret)(.*)/g,

    waitTimeForInitialization: 500,
    buttonPosition: "Dev Tools",
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

    maskSensitiveInfo: text => text.replaceAll(Config.maskingLogFieldRegex, "$1 ****")
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

    findTabByText: text => {
      return Array.from(document.querySelectorAll('[role="tab"]'))
        .find(el => el.textContent.trim() === text);
    },

    findMenuItemByText: text => {
      return Array.from(document.querySelectorAll('[role="menuitem"]'))
        .find(el => el.textContent.trim() === text);
    },

    clickTimelineTab: async () => {
      // Case 1: Timeline tab is directly visible
      const visibleTab = DomOperations.findTabByText("Timeline");
      if (visibleTab) {
        if (visibleTab.getAttribute("aria-selected") !== "true") {
          visibleTab.click();
          await Utils.wait(300);
        }
        return true;
      }

      // Case 2: Timeline tab is inside an overflow dropdown
      // Find the .more-tabs nearest to a "Response" tab (= response pane)
      const responseTab = DomOperations.findTabByText("Response");
      const moreTabs = responseTab?.closest('[role="tablist"]')?.querySelector(".more-tabs");
      if (moreTabs) {
        moreTabs.click();
        await Utils.wait(200);
        const timelineMenuItem = DomOperations.findMenuItemByText("Timeline");
        if (timelineMenuItem) {
          timelineMenuItem.click();
          await Utils.wait(300);
          return true;
        }
      }
      return false;
    },

    getActiveTimelineItem: () => {
      const items = document.querySelectorAll(".timeline-container .timeline-event .timeline-item");
      const expanded = Array.from(items).find(item => item.querySelector(".timeline-item-content"));
      return expanded || null;
    },

    expandFirstTimelineItem: async () => {
      const already = DomOperations.getActiveTimelineItem();
      if (already) return already;

      const header = document.querySelector(".timeline-container .timeline-event .oauth-request-item-header");
      if (header) {
        header.click();
        await Utils.wait(300);
        return header.closest(".timeline-item") || null;
      }
      return null;
    },

    findNetworkLogsLabel: (scope) => {
      const root = scope || document;
      if (root.evaluate) {
        return document.evaluate('.//*[not(contains(name(), "script")) and text() = "Network Logs"]', root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
      }
      return Array.from(root.querySelectorAll("*")).find(el => el.childNodes.length === 1 && el.textContent === "Network Logs");
    },

    clickNetworkLogs: async (scope) => {
      const el = DomOperations.findNetworkLogsLabel(scope);
      if (el) { el.click(); await Utils.wait(100); }
      return !!el;
    },

    clickNetworkLogsPreviousElement: async (scope) => {
      const el = DomOperations.findNetworkLogsLabel(scope);
      if (el?.previousSibling) { el.previousSibling.click(); await Utils.wait(100); }
      return !!(el?.previousSibling);
    },

    insertElementAtPosition: (element, referenceText) => {
      try {
        const node = document.evaluate('//*[not(contains(name(), "script")) and contains(text(), "' + referenceText + '") ]',
          document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);

        const targetElement = node?.parentNode?.parentNode;
        const targetParent = targetElement?.parentNode;
        if (targetParent && targetElement) {
          targetParent.insertBefore(element, targetElement.nextSibling);
          return true;
        }
      } catch (e) { console.error("Failed to insert element:", e); }
      return false;
    }
  };

  // Data processing functions
  const DataProcessor = {
    getNetworkLogs: async (scope) => {
      const root = scope || document;
      return Array.from(root.getElementsByClassName("network-logs-pre")[0].children)
        .flatMap(e => Array.from(e.children))
        .map(e => e.className + "@@@@" + e.textContent)
        .map(t => t.startsWith("network-logs-entry network-logs-entry--info@@@@Current time is") ? "Current time is " + Utils.formatDate(t.replace("network-logs-entry network-logs-entry--info@@@@Current time is ", "")) : t)
        .map(t => t.startsWith("network-logs-entry network-logs-entry--info@@@@") ? Config.includeApplicationMessage ? t.replace(/network-logs-entry network-logs-entry--info@@@@/g, "# ") : "" : t)
        .map(t => t.startsWith("network-logs-entry network-logs-entry--error@@@@") ? Config.includeApplicationMessage ? t.replace(/network-logs-entry network-logs-entry--error@@@@/g, "# ") : "" : t)
        .map(t => t.startsWith("network-logs-entry network-logs-entry--tls@@@@") ? Config.includeConnectionProcessDetails ? t.replace(/network-logs-entry network-logs-entry--tls@@@@/g, "* ") : "" : t)
        .map(t => t.replace(/^network-logs-entry network-logs-entry--request@@@@/g, ""))
        .map(t => t.replace(/^network-logs-entry network-logs-entry--response@@@@/g, ""))
        .map(t => t.replace(/^network-logs-entry@@@@/g, ""))
        .map(t => t.replace(/^network-logs-spacing@@@@$/g, "\n"))
        .filter(t => t !== "> ")
        .filter(t => t !== "")
        .join("\n")
        .trim();
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

        // Ensure Timeline tab is active and get the active (or first) timeline item
        await DomOperations.clickTimelineTab();
        const activeItem = await DomOperations.expandFirstTimelineItem();
        const scope = activeItem?.querySelector(".timeline-item-content") || document;

        // Click Network Logs and get its content
        await DomOperations.clickNetworkLogs(scope);
        await Utils.wait(100);
        const networkLogs = await DataProcessor.getNetworkLogs(scope);

        // Click Response and get its content
        await DomOperations.clickNetworkLogsPreviousElement(scope);
        await Utils.wait(100);
        const networkLogsLabel = DomOperations.findNetworkLogsLabel(scope);
        const responseOutline = Array.from(networkLogsLabel.parentElement.nextElementSibling.children[0].children[0].children).map(e => e.innerText).join(", ")
        const collapsibleSections = scope.querySelectorAll ? Array.from(scope.querySelectorAll(".collapsible-section")) : Array.from(document.getElementsByClassName("collapsible-section"));
        const responseSection = collapsibleSections.length > 1 ? collapsibleSections[1] : collapsibleSections[0];
        const responseBody = responseSection?.querySelector(".CodeMirror")?.CodeMirror?.getValue() || "";

        result.value += responseOutline + ", " + networkLogs + "\n\n" + responseBody + "\n";
        result.value = result.value.replace(/\n{3,}/g, '\n\n');

        // Execute copy
        await DataProcessor.copyToClipboard(result);
        console.log("Copying data completed");
      } catch (e) {
        console.error("Data collection process failed:", e);
      }
    };

    // Disable other click event
    copyButton.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Set click event
    copyButton.addEventListener("click", processData);

    // Place button
    DomOperations.insertElementAtPosition(copyButton, Config.buttonPosition);

    return copyButton;
  };

  // Initialize the Extension
  const initTimeout = setTimeout(() => {
    try {
      const copyButton = createCopyButton();
      console.log(`${Config.ExtensionName} extension has just been initialized`);

      // Return cleanup function
      window.__brunoUserscriptCopyButtonCleanup = () => {
        copyButton.remove();
        console.log(`${Config.ExtensionName} cleaned up`);
      };
    } catch (e) {
      console.error(`${Config.ExtensionName} extension initialization failed:`, e);
    }
  }, Config.waitTimeForInitialization);

  // Return cleanup function
  return () => {
    clearTimeout(initTimeout);
    window.__brunoUserscriptCopyButtonCleanup?.();
    console.log(`${Config.ExtensionName} cleaned up`);
  };
})();
