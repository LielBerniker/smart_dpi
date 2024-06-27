
/*
 * svg path for interface icon
 */
const interfaceIcon =
  "M10.000,8.000 L10.000,7.000 L7.000,7.000 L6.000,7.000 L3.000,7.000 L3.000,8.000 L2.000,8.000 L2.000,7.000 L2.000,6.000 L3.000,6.000 L6.000,6.000 L6.000,5.000 L7.000,5.000 L7.000,6.000 L10.000,6.000 L11.000,6.000 L11.000,7.000 L11.000,8.000 L10.000,8.000 ZM8.000,4.000 L7.000,4.000 L7.000,4.000 L6.000,4.000 L6.000,4.000 L5.000,4.000 C4.448,4.000 4.000,3.552 4.000,3.000 L4.000,1.000 C4.000,0.447 4.448,-0.000 5.000,-0.000 L8.000,-0.000 C8.552,-0.000 9.000,0.447 9.000,1.000 L9.000,3.000 C9.000,3.552 8.552,4.000 8.000,4.000 ZM5.000,10.000 L5.000,12.000 C5.000,12.552 4.552,13.000 4.000,13.000 L1.000,13.000 C0.448,13.000 -0.000,12.552 -0.000,12.000 L-0.000,10.000 C-0.000,9.447 0.448,9.000 1.000,9.000 L1.000,9.000 L1.000,9.000 L4.001,9.000 C4.553,9.001 5.000,9.448 5.000,10.000 ZM9.000,9.000 L9.000,9.000 L9.000,9.000 L12.001,9.000 C12.553,9.001 13.000,9.448 13.000,10.000 L13.000,12.000 C13.000,12.552 12.552,13.000 12.000,13.000 L9.000,13.000 C8.448,13.000 8.000,12.552 8.000,12.000 L8.000,10.000 C8.000,9.447 8.448,9.000 9.000,9.000 Z";

  class GatewayConfigInfo {
    constructor(isEnabled, actionMode, threshold) {
        this.isEnabled = isEnabled;
        this.actionMode = actionMode;
        this.threshold = threshold;
    }
    
}

const smartDpiConfigUpdate = "python3 $FWDIR/bin/smart_dpi_config_update.pyc"
const smartDpiConfigReport = "python3 $FWDIR/bin/smart_dpi_config_report.pyc"
let gatewayName
let currentGatewayInfo = new GatewayConfigInfo()

async function isTaskSucceeded(item, itemNum) {
  console.log(item);
  // try {
    const data = JSON.parse(item);
    console.log(data);
    // Access the status of the first task directly
    if (data.tasks && data.tasks.length > 0) {
      const taskStatus = data.tasks[itemNum].status;
      console.log(taskStatus);
      let statusDescription = data.tasks[itemNum]["task-details"];
      console.log(statusDescription);
      if (taskStatus === "succeeded") {
        let current_task = data.tasks[itemNum]
        console.log(current_task);
        callback(current_task);
        return true;
      } else {
        alert('Item task status is faliure.');
        console.log('Item task status is faliure.');
      }
    } else {
      alert('No tasks found in data.');
      console.log('No tasks found in data.');
    }
  // } catch (error) {
  //   const errorMessage = error.message
  //   alert("Error parsing JSON (isTaskSucceeded):" + errorMessage);
  //   console.log("Error parsing JSON (isTaskSucceeded):" + errorMessage);
  // }
  return false;
}


async function getCongigurationData(task) {
  alert('current task in get conf is ' + task);
  try {
    // Access status description, contains the current gateway configuration of smart dpi
      let statusDescription = task["task-details"][0].statusDescription;
      const statusDetails = JSON.parse(statusDescription);
      currentGatewayInfo.isEnabled = statusDetails.enabled;
      currentGatewayInfo.actionMode = statusDetails.state;
      actionMode.threshold = statusDetails.threshold;
      alert('successfully got gateway configuration information');
      console.log('successfully got gateway configuration information');
  } catch (error) {
    alert("Error parsing JSON(getCongigurationData):" + error);
    console.log("Error parsing JSON(getCongigurationData):" + error);
  }
}

async function reportUpdateConfig(task) {
    alert('successfully updated gateway configuration');
    console.log('successfully updated gateway configuration');
}

function onCommitUpdate(value) {
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    if (!isTaskSucceeded(firstItem, 0)){
      alert('fail to get update Smart Dpi configuration');
      console.log('fail to get update Smart Dpi configuration');
    }
  }
}

function runUpdateConfigOnGW(gatewayInfo) {

  const updateConfigCli = smartDpiConfigUpdate + " " + gatewayInfo.isEnabled + " " + gatewayInfo.actionMode + " " + gatewayInfo.threshold.toString()
  const mgmtCli = `run-script script-name "smart_dpi_config_update" script "${updateConfigCli}" targets.1 "${gatewayName}" --format json`;

  //request to commit changes
  smxProxy.sendRequest("request-commit", {"commands" : [mgmtCli]}, "onCommitUpdate");
}

function initParameters() {

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
    runUpdateConfigOnGW(gatewayInfo)

  });

  thresholdInput.value = Number(currentGatewayInfo.threshold);
  stateAction.textContent = currentGatewayInfo.actionMode;
  if (currentGatewayInfo.actionMode.toLowerCase() === "monitor"){
    toggleAction.checked = false;
  }
  else{
    toggleAction.checked = true;
  }
  if (currentGatewayInfo.isEnabled.toLowerCase() === "false"){
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
  removeLoader()
  if (Array.isArray(value) && value.length > 0) {
    var firstItem = value[0];
    if (!isTaskSucceeded(firstItem, 0)){
      alert('fail to get report of Smart Dpi configuration');
    }
    else{
      initParameters()
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
    // send API request
  smxProxy.sendRequest("get-context", null, "onContext");
}
