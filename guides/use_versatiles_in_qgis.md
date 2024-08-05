# Using VersaTiles in QGIS

## **Access the Layer Menu**
In the top menu, click on `Layer`.  
From the dropdown menu, hover over `Add Layer` and then select `Add Vector Tile Layer...`.  
  
`Layer ►` `Add Layer ►` ![Add Vector Tile Layer](https://docs.qgis.org/3.34/en/_images/mActionAddVectorTileLayer.png) `Add Vector Tile Layer...`

## **Add a New Connection**
In the `Data Source Manager - Vector Tiles` window, click on the `New` button next to the `Connections` dropdown.  
From the dropdown, select `New Generic Connection...`.  
  
`New ▼` `New Generic Connection...`

## **Enter Connection Details**
In the `Vector Tiles Connection` dialog, fill in the following details:
- **Name**: Enter `VersaTiles`.
- **URL**: Enter `https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}`.
- **Min/Max Zoom Level**: Set `Min. Zoom Level` to `0` and `Max. Zoom Level` to `14`.

## **Save the Connection**
After entering all the required information, click `OK` to save the new connection.

## **Select and Add the New Connection**
Now select the new connection `VersaTiles` from the `Connection` dropdown.  
Click on the `Add` button at the bottom right of the window.  
  
After adding the Vector Tile Layer, click `Close` to exit the `Data Source Manager - Vector Tiles` window.
