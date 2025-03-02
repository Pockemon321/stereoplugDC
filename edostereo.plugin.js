/**
 * @name edoStereo
 * @version 0.0.7
 * @description Adds stereo sound to Discord with some extra stuff. Updated for 2025.
 * @authorLink https://github.com/edoderg
 * @website https://edoderg.github.io/
 * @source https://github.com/edoderg/edoStereo
 * @invite fgMC6SetXk
 * @updateUrl https://github.com/edoderg/edoStereo/blob/main/edoStereo.plugin.js
 */
module.exports = (() => {
    const config = {
      main: "index.js",
      info: {
        name: "edoStereo",
        authors: [{ name: "ed.o", discord_id: "269831113919299584" }],
        version: "0.0.7",
        description: "Adds stereo sound to your Discord Client with some extra stuff. Updated for 2025.",
      },
      changelog: [
        {
          title: "Changelog",
          items: [
            "Updated for compatibility with Discord 2025",
            "Improved Webpack module detection",
            "Enhanced Spotify Pause Blocker with fetch support",
            "General bug fixes and optimizations"
          ]
        }
      ],
      defaultConfig: [
        { type: "switch", id: "enableToasts", name: "Enable notifications", note: "Warning for Discord Audio Features", value: true },
        { type: "dropdown", id: "stereoChannelOption", name: "Stereo Channel Option", note: "Select your preferred channel option", value: "2.0", options: [
            { label: "1.0 Mono Sound", value: "1.0" },
            { label: "2.0 Normal Stereo Sound (Default)", value: "2.0" },
            { label: "7.1 Surround Sound", value: "7.1" },
          ]},
        { type: "dropdown", id: "bitrateOption", name: "Bitrate Option", note: "Select your preferred bitrate", value: "384000", options: [
            { label: "48kbps", value: "48000" }, 
            { label: "64kbps", value: "64000" },
            { label: "96kbps", value: "96000" },
            { label: "128kbps", value: "128000" },
            { label: "256kbps", value: "256000" },
            { label: "384kbps (Default)", value: "384000" },
            { label: "512kbps", value: "512000" },
          ]},
        { type: "category", id: "otherSettings", name: "Miscellaneous", shown: true, settings: [
            { type: "switch", id: "enableSpotifyPauseBlocker", name: "Spotify Pause Blocker", note: "Prevents Discord from pausing Spotify after 30 seconds", value: false },
          ]},
      ],
    };
  
    return !global.ZeresPluginLibrary ? class {
      constructor() { this._config = config; }
      getName() { return config.info.name; }
      getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
      getDescription() { return config.info.description; }
      getVersion() { return config.info.version; }
      load() {
        BdApi.showConfirmationModal("[edoStereo] Library Missing", `ZeresPluginLibrary is missing. Click "Install Now" to download it.`, {
          confirmText: "Install Now",
          cancelText: "Cancel",
          onConfirm: () => {
            require("request").get("https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js", async (error, response, body) => {
              if (error) return BdApi.showConfirmationModal("Download Error", "An error occurred while downloading ZeresPluginLibrary.", { confirmText: "OK" });
              await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
            });
          },
        });
      }
      start() {}
      stop() {}
    } : (([Plugin, Api]) => {
      const plugin = (Plugin, Library) => {
        const { WebpackModules, Patcher, Toasts } = Library;
        return class edoStereo extends Plugin {
          onStart() {
            BdApi.UI.showNotice("[edoStereo v.0.0.7] You can now use edoStereo 😉", { type: "info", timeout: 5000 });
            this.settingsWarning();
            this.justJoined = false;
  
            const voiceModule = WebpackModules.getModule(m => m?.prototype?.updateVideoQuality) || WebpackModules.getByProps("updateVideoQuality");
            BdApi.Patcher.after("edoStereo", voiceModule.prototype, "updateVideoQuality", (thisObj, _args, ret) => {
              if (!thisObj?.conn?.setTransportOptions) {
                console.warn("[edoStereo] setTransportOptions not found, Discord API may have changed.");
                return ret;
              }
              const setTransportOptions = thisObj.conn.setTransportOptions;
              const channelOption = this.settings.stereoChannelOption;
              const selectedBitrate = parseInt(this.settings.bitrateOption);
  
              thisObj.conn.setTransportOptions = (obj) => {
                if (obj.audioEncoder) {
                  obj.audioEncoder.params = obj.audioEncoder.params || {};
                  obj.audioEncoder.params.stereo = channelOption;
                  obj.audioEncoder.channels = parseFloat(channelOption);
                  obj.encodingVoiceBitRate = selectedBitrate;
                }
                if (obj.fec !== undefined) obj.fec = false;
                setTransportOptions.call(thisObj.conn, obj);
  
                if (!this.justJoined) {
                  const spotifyStatus = this.settings.otherSettings.enableSpotifyPauseBlocker ? "Enabled" : "Disabled";
                  this.showCustomToast(`edoStereo: Channel ${channelOption}, Bitrate ${selectedBitrate / 1000}kbps, Spotify Blocker: ${spotifyStatus}`, { type: "info", timeout: 5000 });
                  this.justJoined = true;
                }
              };
              return ret;
            });
  
            const voiceConnectionModule = WebpackModules.getModule(m => m?.isConnected && m?.disconnect && m?.hasVideo) || WebpackModules.getByProps("hasVideo", "disconnect", "isConnected");
            this.disconnectPatcher = BdApi.Patcher.after("edoStereo", voiceConnectionModule, "disconnect", () => {
              this.justJoined = false;
            });
  
            if (this.settings.otherSettings.enableSpotifyPauseBlocker) this.enableSpotifyPauseBlocker();
          }
  
          showCustomToast(content, options) {
            const toast = BdApi.UI.showToast(content, options);
            if (toast) {
              Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                left: 'auto',
                bottom: 'auto'
              });
            }
          }
  
          enableSpotifyPauseBlocker() {
            const originalFetch = window.fetch;
            window.fetch = async (url, options) => {
              if (url === "https://api.spotify.com/v1/me/player/pause") {
                url = "https://api.spotify.com/v1/me/player/play";
                this.showCustomToast("edoStereo: Blocked Spotify pause", { type: "success", timeout: 3000 });
              }
              return originalFetch(url, options);
            };
  
            XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
              if (url === "https://api.spotify.com/v1/me/player/pause") url = "https://api.spotify.com/v1/me/player/play";
              this.realOpen(method, url, async, user, password);
            };
  
            const hidePopup = () => {
              const popup = document.querySelector('.popup-container.popup-show');
              if (popup) popup.style.display = 'none';
            };
            this.hidePopupInterval = setInterval(hidePopup, 1000);
  
            this.showCustomToast("edoStereo: Spotify Pause Blocker Enabled", { type: "success", timeout: 6000 });
          }
  
          disableSpotifyPauseBlocker() {
            if (window.fetch !== window.originalFetch) window.fetch = window.originalFetch;
            if (XMLHttpRequest.prototype.realOpen) {
              XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.realOpen;
              delete XMLHttpRequest.prototype.realOpen;
            }
            if (this.hidePopupInterval) clearInterval(this.hidePopupInterval);
            this.showCustomToast("edoStereo: Spotify Pause Blocker Disabled", { type: "warning", timeout: 6000 });
          }
  
          settingsWarning() {
            const voiceSettingsStore = WebpackModules.getByProps("getEchoCancellation");
            if (voiceSettingsStore.getNoiseSuppression() || voiceSettingsStore.getNoiseCancellation() || voiceSettingsStore.getEchoCancellation()) {
              if (this.settings.enableToasts) {
                Toasts.show("Please disable echo cancellation, noise reduction, and noise suppression for optimal edoStereo performance", { type: "warning", timeout: 7000 });
              }
              return true;
            }
            return false;
          }
  
          onStop() {
            Patcher.unpatchAll();
            if (this.disconnectPatcher) this.disconnectPatcher();
            this.disableSpotifyPauseBlocker();
          }
  
          getSettingsPanel() {
            const panel = this.buildSettingsPanel();
            panel.addListener((id, value) => {
              if (id === "enableSpotifyPauseBlocker") {
                value ? this.enableSpotifyPauseBlocker() : this.disableSpotifyPauseBlocker();
              }
            });
            const noteElement = document.createElement("div");
            noteElement.className = "edoStereo-settings-note";
            noteElement.innerHTML = `
              <p style="color: #FF0000; margin-top: 10px;">Note: After changing any setting, please rejoin the voice channel for the changes to take effect.</p>
              <p style="color: #00FF00; margin-top: 5px;">Current settings: Channel ${this.settings.stereoChannelOption}, Bitrate ${parseInt(this.settings.bitrateOption)/1000}kbps, Spotify Pause Blocker: ${this.settings.otherSettings.enableSpotifyPauseBlocker ? "Enabled" : "Disabled"}</p>
            `;
            panel.getElement().append(noteElement);
            return panel.getElement();
          }
        };
      };
      return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
  })();