// for Google Output to drive


// ===== Google config =====
const CLIENT_ID =
  "273160542369-ttt03gmv0iio70vek53dqrqcfs9rt1a6.apps.googleusercontent.com";

const API_KEY =
  "AIzaSyDZkfoh01VUEwX_uK3xn3jVvMLssdPCqoo";

const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

// ===== State =====
let tokenClient;
let gapiInited = false;
let gisInited = false;
initGoogleDriveAuth();

function initGoogleDriveAuth() {
  if (!window.gapi || !window.google?.accounts) {
    setTimeout(initGoogleDriveAuth, 100);
    return;
  }

  const authBtn = document.getElementById("authorize_button");
  if (authBtn) {
    authBtn.onclick = handleAuthClick;
  }

  gapi.load("client", async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // defined later"",
  });

  gisInited = true;
  maybeEnableButtons();
}
document.getElementById("authorize_button")
  .addEventListener("click", function () {
    this.classList.toggle("clicked");
  });
//make button dimmed or blink after clicked
/*document
  .getElementById("authorize_button")
  .addEventListener("click", function () {
    this.classList.add("dimmed");
  });
document.getElementById("upload_button").addEventListener("click", function () {
  this.classList.add("blink");
});

document.getElementById("googleIn").addEventListener("click", function () {
  this.classList.add("blink");
});

document.getElementById("update_button").addEventListener("click", function () {
  this.classList.add("blink");
});*/

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById("authorize_button").disabled = false;
  }
}

function handleAuthClick() {
    tokenClient.requestAccessToken({ prompt: "consent" });
    }

    // Try silent auth once user interacts
    document.addEventListener("click", () => {
    tokenClient.requestAccessToken({ prompt: "" });
    }, { once: true });