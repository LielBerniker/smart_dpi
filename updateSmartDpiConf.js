


const smartDpiConfigUpdate = "python3 $FWDIR/bin/smart_dpi_config_update.pyc";
const smartDpiConfigReport = "python3 $FWDIR/bin/smart_dpi_config_report.pyc";
const disabledMode = 1 /* Send report to cloud only */
const monitordMode = 2 /* Monitor + send log to smart console */
const actionMode = 3 /* Completely enabled */
const monitorStr = "Monitor"
const actionStr = "Action"
const enabledStr = "Enabled"
const disabledStr = "Disabled"
const sliderClass = "slider"
const DisableSliderClass = "sliderDis"

class GatewayConfigInfo {
    constructor(isEnabled, mode, threshold) {
        this.isEnabled = isEnabled;
        this.mode = mode;
        this.threshold = threshold;
    }  
}

class HtmlElements {
  constructor() {
    this.toggleEnableDisable = document.getElementById("toggleEnableDisable");
    this.stateEnableDisable = document.getElementById("stateEnableDisable");
    this.toggleMode = document.getElementById("toggleMode");
    this.stateMode = document.getElementById("stateMode");
    this.sliderMode = document.getElementById("SliderMode");
    this.thresholdInput = document.getElementById('threshold');
    this.EnableDisableUpdate()
    this.modeUpdate()
  }

  modeAcordingToState(enabled) {
    if (!enabled) {
      this.toggleMode.checked =false;
      this.toggleMode.disabled = true;
      this.sliderMode.className = DisableSliderClass;
      this.stateMode.textContent = monitorStr;
    }else{
      this.toggleMode.disabled = false;
      this.sliderMode.className = sliderClass;
    }
  }

  EnableDisableUpdate() {
      // Initial state
    this.stateEnableDisable.textContent = this.toggleEnableDisable.checked ? enabledStr : disabledStr;
    this.modeAcordingToState(!this.toggleEnableDisable.checked)
    // Toggle for Enable/Disable
    this.toggleEnableDisable.addEventListener("change", function() {
      this.stateEnableDisable.textContent = this.toggleEnableDisable.checked ? enabledStr : disabledStr;
      this.modeAcordingToState(!this.toggleEnableDisable.checked)
    });
  } 

  modeUpdate() {
    this.stateMode.textContent = this.toggleMode.checked ? actionStr : monitorStr;
    // Toggle for Monitor/Prevent
    this.toggleMode.addEventListener("change", function() {
      this.stateMode.textContent = this.toggleMode.checked ? actionStr : monitorStr;
    });
  }
  
  UpdateAllElemetns(isEnabled, mode, threshold){
    this.thresholdInput.value = threshold;
    this.stateMode.textContent = mode;
    this.stateEnableDisable.textContent = this.toggleEnableDisable.checked ? enabledStr : disabledStr;
    if (mode.toLowerCase() === "monitor"){
      this.toggleMode.checked = false;
    }
    else{
      this.toggleMode.checked = true;
    }
    let enabled = (isEnabled === 1) ? true : false;
    this.modeAcordingToState(enabled)
    this.toggleEnableDisable.checked = enabled
  }

}


var smartDpiInformationKey = "smart_dpi_information";

window.gatewayName;
window.currentGatewayInfo = new GatewayConfigInfo(0, monitorStr, 60);

function onCommitfetchLocal(value) {
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    console.log("Finish to run fw fetch local");
  }
}

function runLocalFetchOnGW() {

  const fetchLocalCli = "fw fetch local"
  const mgmtCli = `run-script script-name "fw_fetch_local" script "${fetchLocalCli}" targets.1 "${window.gatewayName}" --format json`;
  //request to commit changes
  smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommitfetchLocal");
}

function isTaskSucceeded(item) {
  try {
    // temp1
    console.log(JSON.stringify(item, null, 2));
    const jsonString = item.substring(item.indexOf('{'), item.lastIndexOf('}') + 1);
    console.log(jsonString);
    const jsonData = JSON.parse(jsonString);
    console.log(jsonData);
    // Access the status of the first task directly
    if (jsonData.tasks && jsonData.tasks.length > 0) {
      console.log(jsonData.tasks);
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


function getConfigurationData(item) {
  try {
    const jsonString = item.substring(item.indexOf('{'), item.lastIndexOf('}') + 1);
    const jsonData = JSON.parse(jsonString);
    if (jsonData.tasks && jsonData.tasks.length > 0) {
      statusDescription = jsonData.tasks[0]["task-details"][0].statusDescription;
      const jsonStatusDescription = JSON.parse(statusDescription);
      currentMode = Number(jsonStatusDescription.mode);
      switch(currentMode) {
        case actionMode:
          window.currentGatewayInfo.mode = actionStr
          window.currentGatewayInfo.isEnabled = 1
          break;
        case monitordMode:
          window.currentGatewayInfo.mode = monitorStr
          window.currentGatewayInfo.isEnabled = 1
          break;

        default:
          window.currentGatewayInfo.mode = monitorStr
          window.currentGatewayInfo.isEnabled = 0
      }
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
  console.log(JSON.stringify(value, null, 2));
  
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    console.log(JSON.stringify(firstItem, null, 2));
    if (!isTaskSucceeded(firstItem)){
      alert('fail to update Smart Dpi configuration');
      console.log('fail to update Smart Dpi configuration');
    }
    else{
      updateLocalStorge()
      runLocalFetchOnGW()
    }
  }
}

function runUpdateConfigOnGW() {
  console.log(window.currentGatewayInfo);
  const updateConfigCli = smartDpiConfigUpdate + " " + window.currentGatewayInfo.isEnabled.toString() + " " + window.currentGatewayInfo.mode + " " + window.currentGatewayInfo.threshold.toString()
  console.log(updateConfigCli);
  const mgmtCli = `run-script script-name "smart_dpi_config_update" script "${updateConfigCli}" targets.1 "${window.gatewayName}" --format json`;
  console.log(mgmtCli);


  //request to commit changes
  smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommitUpdate");
}

function updateLocalStorge() {
  console.log(smartDpiInformationKey);
  const SmartDpiObject = {
    enabled: window.currentGatewayInfo.isEnabled,
    state: window.currentGatewayInfo.mode,
    threshold: window.currentGatewayInfo.threshold
  };
  localStorage.setItem(smartDpiInformationKey, JSON.stringify(SmartDpiObject));
  console.log("Finish to update local storage");
}

function initParameters() {
  removeLoader()
  elementsInfo = new HtmlElements();
  elementsInfo.UpdateAllElemetns(window.currentGatewayInfo.isEnabled, window.currentGatewayInfo.mode, window.currentGatewayInfo.threshold)

  // Save button action
  document.getElementById('saveButton').addEventListener('click', function () {
    const isEnabled = elementsInfo.toggleEnableDisable.checked ? 1 : 0;
    const mode = elementsInfo.toggleMode.checked ? actionStr : monitorStr;
    const threshold = elementsInfo.thresholdInput.value;

    if (threshold < 1 || threshold > 100) {
        alert('Please enter a valid threshold percentage between 1 and 100.');
        return;
    }
    window.currentGatewayInfo.isEnabled = isEnabled;
    window.currentGatewayInfo.mode = mode;
    window.currentGatewayInfo.threshold = threshold;
    runUpdateConfigOnGW();

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


function onCommitReport(value) {
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    if (!isTaskSucceeded(firstItem)){
      alert('fail to get report of Smart Dpi configuration');
    }
    else{
      if (!getConfigurationData(firstItem)){
        alert('fail to get Congiguration Data of Smart Dpi');
      }
      else{
        updateLocalStorge()
        initParameters()
      }
    }
  }
}

function onContext(obj) {

  window.gatewayName = obj.event.objects[0]["name"];
  smartDpiInformationKey += "_" + window.gatewayName;
  console.log(smartDpiInformationKey);
  if (!localStorage.hasOwnProperty(smartDpiInformationKey))
  {
    // send API request
    const mgmtCli = `run-script script-name "smart_dpi_config_report" script "${smartDpiConfigReport}" targets.1 "${window.gatewayName}" --format json`;
    smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommitReport");
  }else{
    smartDpiInformation = localStorage.getItem(smartDpiInformationKey);
    const parsedSmartDpiInformation = JSON.parse(smartDpiInformation);
    window.currentGatewayInfo.isEnabled = Number(parsedSmartDpiInformation.enabled);
    window.currentGatewayInfo.mode = parsedSmartDpiInformation.state;
    window.currentGatewayInfo.threshold = Number(parsedSmartDpiInformation.threshold);
    initParameters();
  }

}

/*
 * Send API request 'get-context' (get-context return JSON object of extension location context).
 */
function showContext() {
  addLoader();
  // send API request
  smxProxy.sendRequest("get-context", null, "onContext");
}
