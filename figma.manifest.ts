// https://www.figma.com/plugin-docs/manifest/
export default {
  name: "Pager",
  id: "1362688304628348008",
  api: "1.0.0",
  main: "plugin.js",
  ui: "index.html",
  capabilities: [],
  enableProposedApi: false,
  editorType: ["figma"],
  documentAccess: 'dynamic-page',
  networkAccess: {
    allowedDomains: ['https://*.pager.figfolk.com', 'https://pager.figfolk.com', 'https://*.figfolk.com', 'https://figfolk.com'],
    devAllowedDomains: ['http://localhost']
  },
  permissions: [
    'currentuser',
    'fileusers'
  ]
};
