const PROJECT_BASE_PATH = "/cais-website";

const isExternalAsset = (path: string) =>
  /^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:");

const runtimeBasePath = () => {
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith(PROJECT_BASE_PATH)
  ) {
    return `${PROJECT_BASE_PATH}/`;
  }

  return "/";
};

export const publicAssetPath = (path: string) => {
  if (isExternalAsset(path)) {
    return path;
  }

  return `${runtimeBasePath()}${path.replace(/^\/+/, "")}`;
};
