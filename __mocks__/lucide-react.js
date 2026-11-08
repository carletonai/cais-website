const React = require("react");

const Icon = React.forwardRef(function Icon({ children, ...props }, ref) {
  return React.createElement("svg", { ...props, ref }, children);
});
Icon.displayName = "LucideIconMock";

module.exports = new Proxy(
  { __esModule: true },
  {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      return Icon;
    },
  },
);
