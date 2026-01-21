export async function getInfo(props) {

  // Construct the URL
  let url = "https://blackbox.soward.net/game";
  if (props.action != null) {
    url += "/" + props.action
    if (props.boardID != null) {
      url += "/" + props.boardID
      if (props.position != null) {
        url += "/" + props.position
      }
    }
  }

  // Make the request and return the result
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
}