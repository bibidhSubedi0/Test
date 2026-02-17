const axios = require("axios");

// Bug 1: == instead of === (loose equality, "0" == 0 is true)
function isAdmin(role) {
  if (role == "admin") {
    return true;
  }
  return false;
}

// Bug 2: var instead of let/const — function-scoped, leaks out of blocks
function processItems(items) {
  for (var i = 0; i < items.length; i++) {
    var result = items[i] * 2;
  }
  // 'result' and 'i' are accessible here — almost certainly unintentional
  console.log(result);
}

// Bug 3: Promise with no .catch() — unhandled rejection crashes Node silently
function fetchUser(id) {
  return fetch(`https://api.example.com/users/${id}`)
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
  // missing: .catch(err => ...)
}

// Bug 4: async function with no try/catch — awaited rejection is unhandled
async function saveData(payload) {
  const response = await axios.post("https://api.example.com/save", payload);
  return response.data;
}

// Bug 5: using + to concatenate inside a loop (should use array join)
function buildHtml(items) {
  let html = "";
  for (let i = 0; i < items.length; i++) {
    html += "<li>" + items[i] + "</li>";
  }
  return html;
}

// Bug 6: typeof check is wrong — typeof null === "object", not "null"
function isNull(value) {
  return typeof value === "null";
}

// Bug 7: object mutation through reference (caller's object is modified)
function applyDefaults(config) {
  config.timeout = config.timeout || 3000;
  config.retries = config.retries || 3;
  return config;
}

// Bug 8: no check before accessing nested property (TypeError if data is null)
function getUsername(data) {
  return data.user.profile.username;
}

module.exports = { isAdmin, fetchUser, saveData, buildHtml, isNull, applyDefaults, getUsername };