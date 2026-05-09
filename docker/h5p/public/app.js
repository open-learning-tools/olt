const select = document.getElementById("content-select");
const container = document.getElementById("h5p-container");
const emptyState = document.getElementById("empty-state");
const playerRegion = document.getElementById("player-region");

let contentItems = [];

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
    xAPIObjectIRI: `${window.location.origin}/content/${item.id}`
  };

  await new H5PStandalone.H5P(container, options);

  if (window.H5P?.externalDispatcher) {
    window.H5P.externalDispatcher.on("xAPI", (event) => {
      console.info("xAPI event", event?.data?.statement || event);
    });
  }
}

async function boot() {
  try {
    contentItems = await loadContentList();
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
