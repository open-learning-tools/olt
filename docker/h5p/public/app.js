const select = document.getElementById("content-select");
const container = document.getElementById("h5p-container");
const emptyState = document.getElementById("empty-state");
const playerRegion = document.getElementById("player-region");

let contentItems = [];
let appConfig = { xapi: { ingestUrl: "", activityPrefix: "" } };
let xapiDispatcherAttached = false;

async function loadAppConfig() {
  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load app config: ${response.status}`);
  }

  return response.json();
}

async function loadContentList() {
  const response = await fetch("/api/content");
  if (!response.ok) {
    throw new Error(`Failed to load content list: ${response.status}`);
  }

  const payload = await response.json();
  return payload.content || [];
}

function renderContentOptions() {
  select.innerHTML = "";

  if (contentItems.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No content found";
    select.appendChild(option);
    select.disabled = true;
    emptyState.hidden = false;
    playerRegion.hidden = true;
    return;
  }

  select.disabled = false;
  emptyState.hidden = true;
  playerRegion.hidden = false;

  for (const item of contentItems) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.title;
    select.appendChild(option);
  }
}

function buildActivityIri(contentId) {
  const activityPrefix = appConfig.xapi?.activityPrefix?.trim();
  if (!activityPrefix) {
    return `${window.location.origin}/content/${contentId}`;
  }

  return `${activityPrefix.replace(/\/+$/, "")}/h5p/${encodeURIComponent(contentId)}`;
}

function getStatementFromEvent(event) {
  return event?.data?.statement || event?.statement || null;
}

async function forwardXapiStatement(statement) {
  const ingestUrl = appConfig.xapi?.ingestUrl?.trim();
  if (!ingestUrl || !statement) {
    return;
  }

  const response = await fetch(ingestUrl, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    keepalive: true,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(statement)
  });

  if (!response.ok) {
    throw new Error(`xAPI forward failed: ${response.status}`);
  }
}

function attachXapiForwarder() {
  if (xapiDispatcherAttached || !window.H5P?.externalDispatcher) {
    return;
  }

  window.H5P.externalDispatcher.on("xAPI", (event) => {
    const statement = getStatementFromEvent(event);
    console.info("xAPI event", statement || event);

    forwardXapiStatement(statement).catch((error) => {
      console.warn(error);
    });
  });

  xapiDispatcherAttached = true;
}

async function renderPlayer(contentId) {
  const item = contentItems.find((candidate) => candidate.id === contentId);
  if (!item) {
    return;
  }

  container.innerHTML = "";

  const options = {
    id: item.id,
    h5pJsonPath: item.path,
    frameJs: "/assets/h5p/frame.bundle.js",
    frameCss: "/assets/h5p/styles/h5p.css",
    frame: true,
    fullScreen: true,
    reportingIsEnabled: true,
    xAPIObjectIRI: buildActivityIri(item.id)
  };

  await new H5PStandalone.H5P(container, options);
  attachXapiForwarder();
}

async function boot() {
  try {
    const [config, content] = await Promise.all([loadAppConfig(), loadContentList()]);
    appConfig = config;
    contentItems = content;
    renderContentOptions();

    if (contentItems.length > 0) {
      await renderPlayer(contentItems[0].id);
    }
  } catch (error) {
    console.error(error);
    select.innerHTML = '<option value="">Unable to load content</option>';
    select.disabled = true;
    emptyState.hidden = false;
    playerRegion.hidden = true;
  }
}

select.addEventListener("change", () => {
  renderPlayer(select.value).catch((error) => {
    console.error(error);
  });
});

boot();
