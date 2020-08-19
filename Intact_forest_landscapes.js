// All datasets which are not on Google Earth Engine will need to be downloaded from their source and uploaded to your assets

// ----------- force everything to this scale
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
      maxPixels: 1112
    })
    // Request the data at the scale and projection
    .reproject({
      crs: targProj
  });
  return(res);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ifl = ee.FeatureCollection("projects/unep-wcmc/imported/biodiversity_features/Intact_Forest_Landscapes")

/////// make a binary image from ifl polygons and reproject to 1km pcent cover
var foreground = 1; // set foreground value
var background = 0; // set background value
var roi_image = ee.Image(background) // make an image with the background value
var ifl_image = ee.Image(foreground).clip(ifl) // Create a second image with the foreground value within the polygons.

var ifl_binary = roi_image.where({test:ifl_image, value:ifl_image}); // replace the background image with the foreground value where the polygons occur
var ifl_binary_proj = ifl_binary.reproject(targHansen_proj) // give the image a defined projection (used hansen as it is high resolution)
var ifl_reproj_mean_pcent_cover = reprojectImageEdit(ifl_binary_proj,ee.Reducer.mean()).multiply(10000).round().toUint16() // project image to match target image. Pixel values are percentage of pixel covered by polygon with 10000 being 100%
Map.addLayer(ifl_reproj_mean_pcent_cover, {min:0, max:1, palette:["grey","green"]}, 'IFL 1km pcover',0)

///// Export to asset
var exportRegion = ee.Geometry.Rectangle([-180, -90, 180, 90], null, false);//global export

Export.image.toAsset({
  image: ifl_reproj_mean_pcent_cover, 
  description: "intact_forest_landscapes_pcent_cover_1km",
  assetId: "users/joegosling/Nat_mod/test/intact_forest_landscapes_pcent_cover_1km",
  region: exportRegion,
  scale: targScale,
  crs: targProj,
  maxPixels: 10000000000000
})