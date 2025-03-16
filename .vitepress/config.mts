import GithubSlugger from 'github-slugger'

export default {
  title: "Versatiles",
  description: "A completely FLOSS map stack.",
  head: [
    ["link", { rel: "shortcut icon", sizes: "16x16 24x24 32x32 48x48 64x64", href: "/favicon.ico" }],
    ["link", { rel: "icon", type: "image/png", href: "/versatiles.32.png", sizes: "32x32" }],
    ["link", { rel: "icon", type: "image/png", href: "/versatiles.48.png", sizes: "48x48" }],
    ["link", { rel: "icon", type: "image/png", href: "/versatiles.64.png", sizes: "64x64" }],
    ["link", { rel: "icon", type: "image/png", href: "/versatiles.96.png", sizes: "96x96" }],
  ],
  lastUpdated: true,
  themeConfig: {
    search: {
      provider: "local"
    },
    editLink: {
      pattern: "https://github.com/versatiles-org/versatiles-documentation/edit/main/:path"
    },
    logo: "/versatiles.svg",
    nav: [
      {
        text: "Basics",
        items: [
          { text: "Versatiles",               link: "/basics/versatiles" },
          { text: "Server",                   link: "/basics/versatiles_server" },
          { text: "Frontend",                 link: "/basics/frontend" },
          { text: "Web Maps",                 link: "/basics/web_maps" },
          { text: "Available Tilesets",       link: "/basics/tilesets" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Use Public Tileserver",    link: "guides/use_tiles.versatiles.org" },
          { text: "Install Versatiles",       link: "guides/install_versatiles" },
          { text: "Download Tiles",           link: "guides/download_tiles" },
          { text: "Convert Tilesets",         link: "guides/converter" },
          // { text: "Develop Frontend",         link: "guides/develop_frontend" }, // unpolished
          { text: "Deploy in Google Cloud",   link: "guides/deploy_in_google_cloud" },
          { text: "Deploy on Debian",         link: "guides/deploy_on_debian" },
          { text: "Local Server Debian",      link: "guides/local_server_debian" },
          { text: "Local Server Docker",      link: "guides/local_server_docker" },
          { text: "Local Server Mac",         link: "guides/local_server_mac" },
          { text: "Use Versatiles in QGis",   link: "guides/use_versatiles_in_qgis" },
          { text: "What about mobile?",        link: "guides/what_about_mobile" },
        ],
      },
      {
        text: "Compendium",
        items: [
          { text: "Introduction",             link: "/compendium/introduction" },
          { text: "Wider perspective",        link: "/compendium/wider_perspective" },
          // { text: "Show cases",               link: "/compendium/show_cases" }, // unpolished
          { text: "Tools",                    link: "/compendium/tools" },
          { text: "Container Specification",  link: "/compendium/specification_container" },
          { text: "Frontend Specification",   link: "/compendium/specification_frontend" },
          { text: "Reference Model",          link: "/compendium/specification_reference_model" },
        ],
      },
    ],
    socialLinks: [
      { link: "https://versatiles.org", icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m12 3l8 6v12h-5v-7H9v7H4V9z"/></svg>' } },
      { link: "https://github.com/versatiles-org", icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>' } },
      { link: "https://www.npmjs.com/org/versatiles", icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019l-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>' } },
      { link: "https://mastodon.social/@VersaTiles", icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127C.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611c.118 1.24.325 2.47.62 3.68c.55 2.237 2.777 4.098 4.96 4.857c2.336.792 4.849.923 7.256.38q.398-.092.786-.213c.585-.184 1.27-.39 1.774-.753a.06.06 0 0 0 .023-.043v-1.809a.05.05 0 0 0-.02-.041a.05.05 0 0 0-.046-.01a20.3 20.3 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.6 5.6 0 0 1-.319-1.433a.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546c.376 0 .75 0 1.125-.01c1.57-.044 3.224-.124 4.768-.422q.059-.011.11-.024c2.435-.464 4.753-1.92 4.989-5.604c.008-.145.03-1.52.03-1.67c.002-.512.167-3.63-.024-5.545m-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976c-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35c-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102q0-1.965 1.011-3.12c.696-.77 1.608-1.164 2.74-1.164c1.311 0 2.302.5 2.962 1.498l.638 1.06l.638-1.06c.66-.999 1.65-1.498 2.96-1.498c1.13 0 2.043.395 2.74 1.164q1.012 1.155 1.012 3.12z"/></svg>' } },
      { link: "https://matrix.to/#/#versatiles:matrix.org", icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M.632.55v22.9H2.28V24H0V0h2.28v.55zm7.043 7.26v1.157h.033a3.3 3.3 0 0 1 1.117-1.024c.433-.245.936-.365 1.5-.365q.81.002 1.481.314c.448.208.785.582 1.02 1.108q.382-.562 1.034-.992q.651-.43 1.546-.43q.679 0 1.26.167c.388.11.716.286.993.53c.276.245.489.559.646.951q.229.587.23 1.417v5.728h-2.349V11.52q0-.43-.032-.812a1.8 1.8 0 0 0-.18-.66a1.1 1.1 0 0 0-.438-.448q-.292-.165-.785-.166q-.498 0-.803.189a1.4 1.4 0 0 0-.48.499a2 2 0 0 0-.231.696a6 6 0 0 0-.06.785v4.768h-2.35v-4.8q.002-.38-.018-.752a2.1 2.1 0 0 0-.143-.688a1.05 1.05 0 0 0-.415-.503c-.194-.125-.476-.19-.854-.19q-.168 0-.439.074c-.18.051-.36.143-.53.282a1.64 1.64 0 0 0-.439.595q-.18.39-.18 1.02v4.966H5.46V7.81zm15.693 15.64V.55H21.72V0H24v24h-2.28v-.55z"/></svg>' } },
    ],
    footer: {
      message: 'Released under Unlicense'
    }
  },
  markdown: {
      anchor: {
         slugify: (str) => {
            const slugger = new GithubSlugger();
            return slugger.slug(str);
         }
      }
   },
};
