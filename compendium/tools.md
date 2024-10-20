
# Tools

In our roadmap we plan to develop a number of useful tools aimed at improving the usability and functionality of web-based mapping solutions:

- [ ] **Editorial Tools**: A comprehensive suite of web-based tools designed specifically for newsrooms, enabling the rapid creation of maps:
  - [ ] **Locator Map**: A streamlined tool for creating maps that pinpoint a single location with customisable labels. Ideal for illustrating the location of local events such as demonstrations, emergencies or incidents.
  - [ ] **Area Map**: Allows you to create maps that delineate areas with additional symbols (such as arrows) and annotations. This tool is particularly useful for visualising large-scale effects such as exclusion zones, areas affected by natural disasters or military front lines.
  - [ ] **Points Map**: A utility for plotting a large number of points on a map from data files (CSV, Excel) containing geocoordinates or addresses. Applications include mapping events such as bicycle accidents, showing places of interest such as Christmas markets, or indicating facilities such as COVID-19 test centres.
- [ ] **GeoJSON BBOX Tool**: An easy-to-use web tool for selecting a bounding box (bbox) on a map and exporting the coordinates in various formats, simplifying the process of defining map extents.
- [ ] **Installer**: A web tool that provides customised installation instructions for setting up a map server for a selected region, tailored for multiple platforms including Linux, MacOS, Raspberry Pi and more.
- [ ] **Style-Maker**: A plugin for MapLibre that facilitates the customisation of map styles, allowing users to seamlessly change colours, fonts and language settings. ([Repository](https://github.com/versatiles-org/maplibre-versatiles-styler))
- [ ] **Backend Renderer**: A JavaScript library designed to render specified map regions in PNG or SVG format, providing a flexible solution for static map generation. ([Repository](https://github.com/versatiles-org/versatiles-renderer))
- [ ] **VersaTiles-Studio**: A desktop application developed in Rust that allows the conversion of geographic data into vector tiles while optimising the tile size.
- [ ] **Generate City Maps**: An interactive web demonstration of the capabilities of VersaTiles, allowing users to select a region and automatically generate a stylized city map poster in black and white. ([Examples](https://duckduckgo.com/?va=i&t=hb&q=city+map+poster&iax=images&ia=images))
- [ ] **Style Converter**: A NodeJS utility for converting map styles from the OpenMapTiles schema to the Shortbread schema.