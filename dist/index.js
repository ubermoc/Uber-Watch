const manifest = {"name":"Uber Watch"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaShieldAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"},"child":[]}]})(props);
}

const status = callable("status");
const pause = callable("pause");
const resume = callable("resume");
const unload = callable("unload");
const reload = callable("reload");
const setNoResume = callable("set_no_resume");
const APPS = [
    { name: "Uber Watch for the desktop", what: "The same watchdog with a tray icon, for your Linux desktop.", url: "https://github.com/ubermoc/Uber-Watch-Desktop" },
    { name: "Ubermoc Speech", what: "Hold a button, speak, and your words are typed into any app.", url: "https://github.com/ubermoc/Ubermoc-Speech" },
    { name: "Ubermoc Warcraft Mod Updater", what: "Updates the Ubermoc addons for World of Warcraft.", url: "https://github.com/ubermoc/Ubermoc-Warcraft-Mod-Updater" },
];
function Content() {
    const [more, setMore] = SP_REACT.useState(false);
    const [s, setS] = SP_REACT.useState(null);
    const [msg, setMsg] = SP_REACT.useState("");
    const [working, setWorking] = SP_REACT.useState(false);
    const refresh = async () => { try {
        setS(await status());
    }
    catch {
        setMsg("The plugin did not answer.");
    } };
    SP_REACT.useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, []);
    const act = async (fn) => {
        setWorking(true);
        setMsg("");
        try {
            const r = await fn();
            if (!r.ok)
                setMsg(r.error ?? "Failed.");
        }
        catch {
            setMsg("Failed.");
        }
        setWorking(false);
        refresh();
    };
    const off = working || !!s?.busy;
    return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
        window.SP_REACT.createElement(DFL.PanelSection, { title: "Uber Watch" },
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement("div", null, s ? (s.watching ? "Watching" : "Paused") : "Checking...")),
            window.SP_REACT.createElement(DFL.PanelSectionRow, null, s?.watching
                ? window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", disabled: off, onClick: () => act(pause), description: "Stops watching. The model keeps running, but nothing restarts it if it fails." }, "Pause Uber Watch")
                : window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", disabled: off, onClick: () => act(resume), description: "Starts watching again: restarts the model if it fails and continues cut-off sessions." }, "Resume Uber Watch")),
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement(DFL.ToggleField, { label: "Don't resume sessions by itself", checked: !!s?.no_resume, description: "On: after a restart or reboot, cut-off sessions stay stopped until you continue them.", onChange: (v) => act(() => setNoResume(v)) }))),
        window.SP_REACT.createElement(DFL.PanelSection, { title: "Model" },
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement("div", null, s?.busy ? s.busy + "..." : s ? s.model : "Checking...")),
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", disabled: off || !s?.loaded, onClick: () => act(unload), description: "Unloads the model to free memory and pauses Uber Watch, so it doesn't load the model again." }, "Unload model")),
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", disabled: off || !!s?.loaded, onClick: () => act(reload), description: "Loads the last model again. If Unload paused Uber Watch, it starts watching again." }, "Reload model"))),
        window.SP_REACT.createElement(DFL.PanelSection, { title: "More from Ubermoc" },
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => setMore(!more) }, more ? "Hide the list" : "Downloads: more Uber apps for game mode")),
            more && APPS.map((a) => (window.SP_REACT.createElement(DFL.PanelSectionRow, { ...{ key: a.url } },
                window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", description: a.what, onClick: () => DFL.Navigation.NavigateToExternalWeb(a.url) }, a.name))))),
        (msg || s?.log) && (window.SP_REACT.createElement(DFL.PanelSection, null,
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement("div", { style: { fontSize: "12px", opacity: 0.7 } }, msg || s?.log))))));
}
var index = definePlugin(() => ({
    name: "Uber Watch",
    titleView: window.SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "Uber Watch"),
    content: window.SP_REACT.createElement(Content, null),
    icon: window.SP_REACT.createElement(FaShieldAlt, null),
    onDismount() { },
}));

export { index as default };
//# sourceMappingURL=index.js.map
