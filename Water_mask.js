// All datasets which are not on Google Earth Engine will need to be downloaded from their source and uploaded to your assets

var mainlands = ee.FeatureCollection("projects/unep-wcmc/imported/admin_boundaries/gvs_mainlands") //global shoreline
var big_islands = ee.FeatureCollection("projects/unep-wcmc/imported/admin_boundaries/gvs_big_islands") //global shoreline

//////////////// force water to this scale
var targImage = ee.Image("projects/unep-wcmc/imported/Critical_Habitat_Layer/Global_Critical_Habitat_Screening_Layer");
var targProj = targImage.projection()
var targScale = targImage.projection().nominalScale().getInfo()
// print (targScale,"target scale")
var targHansen_proj = hansen.projection()


/////////////////////////////////////////////////////////////////////////////////////////////////////
//------------function to rescale rasters
var reprojectImageEdit = function(image,reducer){
   var targProj = targImage.projection();
  image = image.reproject({crs: image.projection()});
  var res = image.reproject(image.projection())
    // Force the next reprojection to aggregate instead of resampling.
    .reduceResolution({
      reducer: reducer,
      maxPixels: 1261
    })
    // Request the data at the scale and projection
    .reproject({
      crs: targProj
  });
  return(res);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////turn basemap to 1km raster
var foreground = 1; // set foreground value
var background = 0; // set background value
var roi_image = ee.Image(background) // make an image with the background value

var merge_basemap = mainlands.merge(big_islands) // merge mainlands and islands into one
var basemap_image = ee.Image(foreground).clip(merge_basemap) // Create an image with the foreground value within the polygons.
var basemap_binary = roi_image.where({test:basemap_image, value:basemap_image}); // replace the background image with the foreground value where the polygons occur
var basemap_binary_proj = basemap_binary.reproject(targHansen_proj) // give the image a defined projection (used hansen as it is high resolution)
var basemap_reproj_mean_pcent_cover = reprojectImageEdit(basemap_binary_proj,ee.Reducer.mean()).multiply(10000).round().toUint16() // project image to match target image. Pixel values are percentage of pixel covered by polygon with 10000 being 100%
Map.addLayer(basemap_reproj_mean_pcent_cover, {min:0, max:1, palette:["grey","red"]}, 'basemap 1km pcover',0)
var basemap_reproj_mean_pcent_cover_100 = basemap_reproj_mean_pcent_cover.eq(10000) // select only cells that are completely covered by land
Map.addLayer(basemap_reproj_mean_pcent_cover_100, {min:0, max:1, palette:["grey","red"]}, 'basemap 1km 100%',0)

////// select and project copernicus water cells to mask out water from final layer
var copernicus = ee.ImageCollection("COPERNICUS/Landcover/100m/Proba-V/Global").filter(ee.Filter.eq("system:index","2015")); // import copernicus landcover. When other years become available change "2015" to the year you want
var lc_discrete = ee.Image(copernicus.select('discrete_classification').first()) // select discrete_classification band
var water = lc_discrete.eq(80).byte()// select water pixels (80)

var water_reproj_pcent_cover = reprojectImageEdit(water,ee.Reducer.mean()).multiply(10000).round().toUint16() // project image to match target image. Pixel values are percentage of pixel covered by polygon with 10000 being 100%
var water_reproj_pcent_cover_gt50 = water_reproj_pcent_cover.gt(5000) //Select only cells which are more than 50% covered by water

var water_reproj_pcent_cover_gt50_basemap_clip = roi_image.where(basemap_reproj_mean_pcent_cover_100, water_reproj_pcent_cover_gt50) ///// clip to land to remove marine water 
Map.addLayer(water_reproj_pcent_cover_gt50_basemap_clip,{min:0,max:1}, 'water 1km basemap clip', 0)

///// Export to asset
var exportRegion = ee.Geometry.Rectangle([-180, -80, 180, 80], null, false);////Seems to be an issue with Copernicus exporting high and low latitude areas which is why it is set to 80 rather than 90


Export.image.toAsset({
  image: water_reproj_pcent_cover_gt50_basemap_clip, 
  description: "water_reproj_pcent_cover_gt50_basemap_clip",
  assetId: "users/joegosling/Nat_mod/test/water_reproj_pcent_cover_gt50_basemap_clip_1km",
  region: exportRegion,
  scale: targScale,
  crs: targProj,
  maxPixels: 10000000000000
})
