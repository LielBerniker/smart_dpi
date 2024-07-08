
class GatewayConfigInfo {
    constructor(isEnabled, actionMode, threshold) {
        this.isEnabled = isEnabled;
        this.actionMode = actionMode;
        this.threshold = threshold;
    }  
}

const smartDpiConfigUpdate = "python3 $FWDIR/bin/smart_dpi_config_update.pyc";
const smartDpiConfigReport = "python3 $FWDIR/bin/smart_dpi_config_report.pyc";
const smartDpiInformationKey = "smart_dpi_information";

let gatewayName;
window.currentGatewayInfo = new GatewayConfigInfo("Enabled", "Monitor", "60");

function onCommitfetchLocal(value) {
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    console.log("Finish to run fw fetch local");
  }
}

function runLocalFetchOnGW() {

  const fetchLocalCli = "fw fetch local"
  const mgmtCli = `run-script script-name "fw_fetch_local" script "${fetchLocalCli}" targets.1 "${gatewayName}" --format json`;
  //request to commit changes
  smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommitfetchLocal");
}

function isTaskSucceeded(item) {
  try {
    // temp1
    const jsonString = item.substring(item.indexOf('{'), item.lastIndexOf('}') + 1);
    const jsonData = JSON.parse(jsonString);
    // Access the status of the first task directly
    if (jsonData.tasks && jsonData.tasks.length > 0) {
      const taskStatus = jsonData.tasks[0].status;
      if (taskStatus === "succeeded") {
        return true;
      } else {
        alert('Item task status is faliure.');
        console.log('Item task status is faliure.');
      }
    } else {
      alert('No tasks found in data.');
      console.log('No tasks found in data.');
    }
  } catch (error) {
    const errorMessage = error.message
    alert("Error parsing JSON (isTaskSucceeded):" + errorMessage);
    console.log("Error parsing JSON (isTaskSucceeded):" + errorMessage);
  }
  return false;
}


function getCongigurationData(item) {
  try {
    const jsonString = item.substring(item.indexOf('{'), item.lastIndexOf('}') + 1);
    const jsonData = JSON.parse(jsonString);
    if (jsonData.tasks && jsonData.tasks.length > 0) {
      statusDescription = jsonData.tasks[0]["task-details"][0].statusDescription;
      const jsonStatusDescription = JSON.parse(statusDescription);
      console.log(jsonStatusDescription); 
      window.currentGatewayInfo.isEnabled = (jsonStatusDescription.enabled.toLowerCase() === 'true') ? true : false;
      window.currentGatewayInfo.actionMode = jsonStatusDescription.state;
      window.currentGatewayInfo.threshold = Number(jsonStatusDescription.threshold);
      console.log('successfully got gateway configuration information'); 
      return true;
    } else {
      alert('No tasks found in data.');
      console.log('No tasks found in data.');
    }
  } catch (error) {
    alert("Error parsing JSON(getCongigurationData):" + error);
    console.log("Error parsing JSON(getCongigurationData):" + error);
  }
  return false;
}

function onCommitUpdate(value) {
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    if (!isTaskSucceeded(firstItem)){
      alert('fail to get update Smart Dpi configuration');
      console.log('fail to get update Smart Dpi configuration');
    }
    else{
      runLocalFetchOnGW()
    }
  }
}

function runUpdateConfigOnGW(gatewayInfo) {

  const updateConfigCli = smartDpiConfigUpdate + " " + gatewayInfo.isEnabled + " " + gatewayInfo.actionMode + " " + gatewayInfo.threshold.toString()
  const mgmtCli = `run-script script-name "smart_dpi_config_update" script "${updateConfigCli}" targets.1 "${gatewayName}" --format json`;

  //request to commit changes
  smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommitUpdate");
}

function updateLocalStorge(gatewayInfo) {

  const SmartDpiObject = {
    enabled: gatewayInfo.isEnabled,
    state: gatewayInfo.actionMode,
    threshold: gatewayInfo.threshold
  };
  localStorage.setItem(smartDpiInformationKey, JSON.stringify(SmartDpiObject));
  console.log("Finish to update local storage");
}

function initParameters() {
  removeLoader()
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

    gatewayInfo = new GatewayConfigInfo(isEnabled, actionMode, threshold);
    runUpdateConfigOnGW(gatewayInfo);
    updateLocalStorge(gatewayInfo);

  });

  thresholdInput.value = window.currentGatewayInfo.threshold;
  stateAction.textContent = window.currentGatewayInfo.actionMode;
  if (window.currentGatewayInfo.actionMode.toLowerCase() === "monitor"){
    toggleAction.checked = false;
  }
  else{
    toggleAction.checked = true;
  }
  if (!window.currentGatewayInfo.isEnabled){
    toggleEnableDisable.checked = false;
  }
  else{
    toggleEnableDisable.checked = true;
  }
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


function onCommitReport(value) {
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    if (!isTaskSucceeded(firstItem)){
      alert('fail to get report of Smart Dpi configuration');
    }
    else{
      if (!getCongigurationData(firstItem)){
        alert('fail to get Congiguratio nData of Smart Dpi');
      }
      else{
        initParameters()
      }
    }
  }
}

function onContext(obj) {
  gatewayName = obj.event.objects[0]["name"];
  const mgmtCli = `run-script script-name "smart_dpi_config_report" script "${smartDpiConfigReport}" targets.1 "${gatewayName}" --format json`;
  smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommitReport");
}


/*
 * Send API request 'get-context' (get-context return JSON object of extension location context).
 */
function showContext() {
  addLoader();
  if (!localStorage.hasOwnProperty(smartDpiInformationKey))
  {
    // send API request
    smxProxy.sendRequest("get-context", null, "onContext");
  }else{
    smartDpiInformation = localStorage.getItem(smartDpiInformationKey);
    const parsedSmartDpiInformation = JSON.parse(smartDpiInformation);
    window.currentGatewayInfo.isEnabled = parsedSmartDpiInformation.enabled;
    window.currentGatewayInfo.actionMode = parsedSmartDpiInformation.state;
    window.currentGatewayInfo.threshold = parsedSmartDpiInformation.threshold;
    initParameters();
  }

}
