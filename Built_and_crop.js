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
      maxPixels: 2982
    })
    // Request the data at the scale and projection
    .reproject({
      crs: targProj
  });
  return(res);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var copernicus = ee.ImageCollection("COPERNICUS/Landcover/100m/Proba-V/Global").filter(ee.Filter.eq("system:index","2015")); // import copernicus landcover. When other years become available change "2015" to the year you want
var lc_discrete = ee.Image(copernicus.select('discrete_classification').first()) // select discrete_classification band

var crop = lc_discrete.eq(40).byte()// select crop pixels (40)
var built = lc_discrete.eq(50).byte()// select built pixels (40)
var crop_built = crop.where(built, built)
var crop_built_reproj_pcent_cover = reprojectImageEdit(crop_built,ee.Reducer.mean()).multiply(10000).round().toUint16() // project image to match target image. Pixel values are percentage of pixel covered by polygon with 10000 being 100%
Map.addLayer(crop_built_reproj_pcent_cover,{min:0,max:1000}, 'crop built 1km', 0)


///// Export to asset
var exportRegion = ee.Geometry.Rectangle([-180, -80, 180, 80], null, false);//Seems to be an issue with Copernicus exporting high and low latitude areas which is why it is set to 80 rather than 90


Export.image.toAsset({
  image: crop_built_reproj_pcent_cover, 
  description: "copernicus_crop_built_pcent_cover_1km",
  assetId: "users/joegosling/Nat_mod/test/copernicus_crop_built_pcent_cover_1km",
  region: exportRegion,
  scale: targScale,
  crs: targProj,
  maxPixels: 10000000000000
})
