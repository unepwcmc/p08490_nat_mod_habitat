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


var plantation = ee.Image("") // insert plantation asset
var forest = hansen.select('treecover2000') // select treecover band
var forest_loss = hansen.select('loss') // select loss band

var forest_30 = forest.gt(30) // select forest with canopy cover greater than 30%
var forest_minus_loss = forest_30.where({test:forest_loss, value:0}) // remove forest loss pixels from forest cover
var forest_minus_loss_and_plantation = forest_minus_loss.where({test:plnatation, value:0})
var forest_minus_loss_and_plantation_reproj = reprojectImageEdit(forest_minus_loss_and_plantation,ee.Reducer.mean()).multiply(10000).round().toUint16() // project image to match target image. Pixel values are percentage of pixel covered by polygon with 10000 being 100%
Map.addLayer(forest_minus_loss_and_plantation_reproj,{min:0,max:1, palette:["grey","green"]},"Forest 1km pcover",0)

/// Export forest to asset to speed up processing and viewing
var exportRegion = ee.Geometry.Rectangle([-180, -90, 180, 90], null, false);//global export

Export.image.toAsset({
  image: forest_minus_loss_and_plantation_reproj, 
  description: "forest_30__minus_loss_and_plantation_1km_pcover",
  assetId: "users/joegosling/Nat_mod/test/forest_30__minus_loss_and_plantation_1km_pcover",
  region: exportRegion,
  scale: targScale,
  crs: targProj,
  maxPixels: 10000000000000
})





