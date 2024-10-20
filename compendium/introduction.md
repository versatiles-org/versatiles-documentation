# Introduction

Since the early 1990s, the web has seen significant technological advances. New standards and tools have made it easier to publish text, articles, photos, videos and other forms of media. However, publishing maps remains particularly challenging.

Several factors contribute to this challenge:
1. Geospatial data, satellite imagery and aerial photography, is often copyrighted, making it expensive and inaccessible for open use.   
Some governments have not yet embraced the idea of open data and instead produce geospatial data mainly for commercial purposes.
1. Presenting map data on the web in an interactive format can be complex due to various factors such as data formats, geographic projections, server infrastructure requirements and the intricacies of front-end frameworks.

Despite these challenges, the wealth of available data, standards and frameworks - many of which are open or freely available - provides a unique opportunity to build a web mapping infrastructure. However, the diversity of solutions makes it difficult to put the pieces together.

VersaTiles aims to define and implement a standardised map infrastructure that provides a streamlined approach to integrating maps into web platforms.


## Who needs web maps?

Basically, every person and every object on the planet has a geo-coordinate. Even you have a geo-coordinate right now. No data is more useful than geodata, and no visualisation is more familiar than maps.

- **Data Journalism**: Journalists and media outlets often rely on maps to tell stories more effectively, providing readers with a visual context for complex issues such as war zones, political events or natural disasters.
- **Research**: Researchers studying environmental issues, climate change or other global or local phenomena need a tool to analyse and visualise their data.
- **Emergency Response**: In times of crisis, such as natural disasters or public health emergencies, organisations need maps to visualise affected areas and communicate local information to the public.
- **Communities**: There are so many great communities out there, such as citizen science, community-based bike sharing, community-supported agriculture and many more, that need a simple, cost-effective way to display location information.


## What are Slippy Maps?

One of the most successful techniques for publishing interactive web maps is called 'slippy maps'. ([Wikipedia](https://en.wikipedia.org/wiki/Tiled_web_map), [OSM Wiki](https://wiki.openstreetmap.org/wiki/Slippy_map))

The first step is to project all geographic data onto a 2D plane using the [Mercator projection](https://en.wikipedia.org/wiki/Mercator_projection). The Mercator projection has some limitations. For example, it cannot represent the north and south poles, and objects near the equator, such as Africa, appear smaller than those near the poles, such as Greenland. However, the Mercator projection has one major advantage: it always shows north as up, west as left, and does not distort small areas the size of a city. This makes it an excellent option for publishing a global map that can be easily zoomed in and out to accurately show any location.

Once all the geographical data and/or images have been projected onto a world map, the challenge is to present this information on a web front-end without having to download large amounts of data. The solution provided by 'slippy maps' is to create a square world map at a very low resolution (zoom level 0). To increase the resolution at zoom level 1, the 'world map' is doubled in resolution and divided into four squares (northwest, northeast, southwest, southeast). Zoom level 2 consists of 16 tiles. The rule is that zoom level n has 4ⁿ tiles.

The tiles can be saved images (such as JPEG or PNG) with a resolution of 256x256 pixels. There is a [standard way of naming these files](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames), typically in the format: `{zoom_level}/{column}/{row}.jpg`.

A frontend such as [MapLibre](https://maplibre.org/), [Leaflet](https://leafletjs.com/) or [OpenLayers](https://openlayers.org/) can then load the relevant tiles and display them in the correct position, creating the illusion of a continuous map that can be zoomed and dragged to any position.

This approach works well for image tiles, such as satellite and aerial imagery. However, it has some disadvantages when displaying [thematic maps](https://en.wikipedia.org/wiki/Thematic_map), such as city maps. When zooming in, the map has to transition from one zoom level to another, causing labels to disappear and reappear. Image tiles do not provide a smooth zooming experience.

So the concept of "slippy maps" has been improved by using vector data instead of images. [Vector tiles](https://wiki.openstreetmap.org/wiki/Vector_tiles) can store points, paths, polygons and their properties - much like SVG. But because SVG is too cumbersome, Mapbox has developed a [vector tiles standard](https://docs.mapbox.com/data/tilesets/guides/vector-tiles-standards) that stores geographic data as compact [protobufs](https://protobuf.dev/) (PBF). The frontend should read the geographic data and draw the map accordingly. One advantage is that the map style can be defined in the frontend, so that the colour or even the language of the map can be adjusted. Rendering large amounts of vector data can be computationally expensive, so vector tiles are typically rendered on the GPU using libraries such as WebGL, OpenGL or Vulcan.


## Why is there no simple solution?

Generating, serving, and visualising map tiles can be a complex process due to the variety of tile formats, hosting options, storage and generation methods, serving and display techniques, map data styling approaches, and data source combinations. In addition, front-ends must render vector data, satellite imagery, hillshading, data visualisation layers, and interactive front-end elements.

Commercial vendors such as Mapbox address these challenges by offering a comprehensive software suite. However, the solution is expensive, leads to vendor lock-in and raises privacy concerns.

A free and open source system would be ideal. Although open source alternatives exist for each problem, integrating them into a single infrastructure can be challenging. It is not feasible to develop a single software solution that solves all the problems at once and remains flexible enough for different use cases.


## How does VersaTiles solve the problem?

To find a solution to such a wide range of problems, we looked to the development of the Internet itself for inspiration. Instead of creating a single piece of software to run the entire Internet, the OSI model was developed. This reference model segments the problem into manageable pieces and defines specifications for each component. This segmentation ensures that individual software solutions can be developed independently while remaining compatible with others that adhere to OSI standards.

Using the OSI model as a blueprint, we broke down the complex problem into smaller, more manageable pieces. This allowed us to standardise each segment and its connections, ensuring cohesion across all components.

The 'big problem' was conceptualised as a pipeline that generates, serves and displays map data. We divided the pipeline into four sub-segments and developed specifications to define the interfaces between them. We also provide free reference implementations for each segment, as well as a reference pipeline that anyone can use for free.

This allows anyone to use our map tile service for free, or to use parts or the whole pipeline in their own infrastructure. VersaTiles allows you to deviate from the reference pipeline at any point and still use all the other pipeline components. This ensures that you have a stable platform to use and build on, but also gives you the flexibility and freedom to experiment.
