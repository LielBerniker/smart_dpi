
/*
 * svg path for interface icon
 */
const interfaceIcon =
  "M10.000,8.000 L10.000,7.000 L7.000,7.000 L6.000,7.000 L3.000,7.000 L3.000,8.000 L2.000,8.000 L2.000,7.000 L2.000,6.000 L3.000,6.000 L6.000,6.000 L6.000,5.000 L7.000,5.000 L7.000,6.000 L10.000,6.000 L11.000,6.000 L11.000,7.000 L11.000,8.000 L10.000,8.000 ZM8.000,4.000 L7.000,4.000 L7.000,4.000 L6.000,4.000 L6.000,4.000 L5.000,4.000 C4.448,4.000 4.000,3.552 4.000,3.000 L4.000,1.000 C4.000,0.447 4.448,-0.000 5.000,-0.000 L8.000,-0.000 C8.552,-0.000 9.000,0.447 9.000,1.000 L9.000,3.000 C9.000,3.552 8.552,4.000 8.000,4.000 ZM5.000,10.000 L5.000,12.000 C5.000,12.552 4.552,13.000 4.000,13.000 L1.000,13.000 C0.448,13.000 -0.000,12.552 -0.000,12.000 L-0.000,10.000 C-0.000,9.447 0.448,9.000 1.000,9.000 L1.000,9.000 L1.000,9.000 L4.001,9.000 C4.553,9.001 5.000,9.448 5.000,10.000 ZM9.000,9.000 L9.000,9.000 L9.000,9.000 L12.001,9.000 C12.553,9.001 13.000,9.448 13.000,10.000 L13.000,12.000 C13.000,12.552 12.552,13.000 12.000,13.000 L9.000,13.000 C8.448,13.000 8.000,12.552 8.000,12.000 L8.000,10.000 C8.000,9.447 8.448,9.000 9.000,9.000 Z";

  class GatewayConfigInfo {
    constructor(name, isEnabled, actionMode, threshold) {
        this.name = name;
        this.isEnabled = isEnabled;
        this.actionMode = actionMode;
        this.threshold = threshold;
    }
}

const smartDpiConfig = "python3 smart_dpi_config_update.pyc"


  function onCommit(value) {
    removeLoader()
    if (Array.isArray(value) && value.length > 0) {
      var firstItem = value[0];
      alert(firstItem);
    }
  }

  function runUpdateConfigOnGW(gatewayInfo) {

    const updateConfigCli = smartDpiConfig + " " + gatewayInfo.isEnabled + " " + gatewayInfo.actionMode + " " + gatewayInfo.threshold.toString()
    const mgmtCli = `mgmt_cli run-script script-name "smart_dpi_config_update" script "${updateConfigCli}" targets.1 "${gatewayInfo.name}" --format json`;

    //request to commit changes
    smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommit");
  }

  function initParameters(obj) {

    const toggleEnableDisable = document.getElementById("toggleEnableDisable");
    const stateEnableDisable = document.getElementById("stateEnableDisable");
    const toggleAction = document.getElementById("toggleAction");
    const stateAction = document.getElementById("stateAction");
  
    // Initial state
    stateEnableDisable.textContent = toggleEnableDisable.checked ? "Enabled" : "Disabled";
    stateAction.textContent = toggleAction.checked ? "Prevent" : "Monitor";
  
    // Toggle for Enable/Disable
    toggleEnableDisable.addEventListener("change", function() {
      stateEnableDisable.textContent = toggleEnableDisable.checked ? "Enabled" : "Disabled";
    });
  
    // Toggle for Monitor/Prevent
    toggleAction.addEventListener("change", function() {
      stateAction.textContent = toggleAction.checked ? "Prevent" : "Monitor";
    });

    const thresholdInput = document.getElementById('threshold');
    thresholdInput.addEventListener('input', function () {
      const thresholdValue = thresholdInput.value;
      if (thresholdValue < 1 || thresholdValue > 100) {
          alert('Please enter a valid threshold percentage between 1 and 100.');
      }
    });

    // Save button action
    document.getElementById('saveButton').addEventListener('click', function () {
      const isEnabled = toggleEnableDisable.checked;
      const actionMode = toggleAction.checked ? 'Prevent' : 'Monitor';
      const threshold = thresholdInput.value;
  
      if (threshold < 1 || threshold > 100) {
          alert('Please enter a valid threshold percentage between 1 and 100.');
          return;
      }

      var name = obj.event.objects[0]["name"];

      addLoader()
      gatewayInfo = new GatewayConfigInfo(name, isEnabled, actionMode, threshold);
      runUpdateConfigOnGW(gatewayInfo)
      // Display the collected data
      console.log({
          enabled: isEnabled,
          actionMode: actionMode,
          threshold: threshold
      });
  
      // alert('Data saved!');
    });

}


/*
 * add loader text
 */
function addLoader() {
  var loader = document.createElement("div");
  var text = document.createElement("p");
  text.setAttribute("id", "loader-text");
  text.innerText = "Loading...";
  document.body.appendChild(text);
}

/*
 * Remove loader text
 */
function removeLoader() {
  var text = document.getElementById("loader-text");
  document.body.removeChild(text);
}

function onContext(obj) {
  removeLoader()
  initParameters(obj)
}


/*
 * Send API request 'get-context' (get-context return JSON object of extension location context).
 */
function showContext() {
  addLoader();
  // send API request
  // smxProxy.sendRequest("get-context", null, "onContext");
  smxProxy.sendRequest("get-context", null, "onContext");
}
