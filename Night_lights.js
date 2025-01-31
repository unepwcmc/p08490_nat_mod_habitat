// All datasets which are not on Google Earth Engine will need to be downloaded from their source and uploaded to your assets

// ----------- force everything to this scale
var targImage = ee.Image("projects/unep-wcmc/imported/Critical_Habitat_Layer/Global_Critical_Habitat_Screening_Layer");
var targProj = targImage.projection()
var targScale = targImage.projection().nominalScale().getInfo()
// print (targScale,"target scale")


/////////////////////////////////////////////////////////////////////////////////////////////////////
//------------function to rescale rasters
var reprojectImageEdit = function(image,reducer){
   var targProj = targImage.projection();
  image = image.reproject({crs: image.projection()});
  var res = image.reproject(image.projection())
    // Force the next reprojection to aggregate instead of resampling.
    .reduceResolution({
      reducer: reducer,
      maxPixels: 1112
    })
    // Request the data at the scale and projection
    .reproject({
      crs: targProj
  });
  return(res);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var nightlights = ee.ImageCollection("NOAA/DMSP-OLS/NIGHTTIME_LIGHTS")
        .filter(ee.Filter.date('2013-01-01', '2013-12-31'));
var stable = nightlights.select('stable_lights') // select stable lights band
var lights = ee.Image(stable.first()).gte(6)
var lights_proj = reprojectImageEdit(lights,ee.Reducer.mean()).multiply(10000).round().toUint16() // project image to match target image. Pixel values are percentage of pixel covered by polygon with 10000 being 100%
Map.addLayer(lights_proj, {min: 0, max: 1}, 'lights 1km',0)

/// Export to asset
var exportRegion = ee.Geometry.Rectangle([-180, -90, 180, 90], null, false);//global export

Export.image.toAsset({
  image: lights_proj, 
  description: "nightlights_reproj_mean_pcent_cover",
  assetId: "users/joegosling/Nat_mod/test/nightlights_reproj_mean_pcent_cover",
  region: exportRegion,
  scale: targScale,
  crs: targProj,
  maxPixels: 10000000000000
})
