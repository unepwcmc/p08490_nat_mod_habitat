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

var wild = ee.FeatureCollection("projects/unep-wcmc/imported/wilderness/Pressure_free_lands_09");

/////// make a binary image from wilderness polygons and reproject to 1km pcent cover
var foreground = 1; // set foreground value
var background = 0; // set background value
var roi_image = ee.Image(background) // make an image with the background value

var wild_image = ee.Image(foreground).clip(wild) // Create a second image with the foreground value within the polygons.
var wild_binary = roi_image.where({test:wild_image, value:wild_image}); // replace the background image with the foreground value where the polygons occur
var wild_binary_proj = wild_binary.reproject(targHansen_proj) // give the image a defined projection (used hansen as it is high resolution)
var wild_reproj_mean_pcent_cover = reprojectImageEdit(wild_binary_proj,ee.Reducer.mean()).multiply(10000).round().toUint16() // project image to match target image. Pixel values are percentage of pixel covered by polygon with 10000 being 100%
Map.addLayer(wild_reproj_mean_pcent_cover, {min:0, max:1, palette:["grey","green"]}, 'wild 1km pcover',0)

/// Export to asset
var exportRegion = ee.Geometry.Rectangle([-180, -90, 180, 90], null, false);//global export

Export.image.toAsset({
  image: wild_reproj_mean_pcent_cover, 
  description: "wilderness_pcent_cover_1km",
  assetId: "users/joegosling/Nat_mod/test/wilderness_pcent_cover_1km",
  region: exportRegion,
  scale: targScale,
  crs: targProj,
  maxPixels: 10000000000000
})
