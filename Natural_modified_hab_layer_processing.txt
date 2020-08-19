///////// Script to combine processed layers into final screening layer
// All datasets which are not on Google Earth Engine will need to be downloaded from their source and uploaded to your assets

///// define variables and set percent cover thresholds
// Likely Natural
var ifl_pcover_1km = ee.Image("users/joegosling/Nat_mod/test/intact_forest_landscapes_pcent_cover_1km")
var wild_pcover_1km = ee.Image("users/joegosling/Nat_mod/test/wilderness_pcent_cover_1km")
// Potential Natural
var mangrove_pcover_1km = ee.Image("users/joegosling/Nat_mod/test/mangrove_reproj_mean_pcent_cover")
var saltmarsh_pcover_1km = ee.Image("users/joegosling/Nat_mod/test/saltmarsh_reproj_mean_pcent_cover_1km")
var forest_minus_loss_plant_30_pcover = ee.Image("projects/unep-wcmc/imported/habitats/forest_30__minus_loss_and_plantation_1km_pcover")
// Potential modified
var nightlights_pcover_1km = ee.Image("users/joegosling/Nat_mod/test/nightlights_reproj_mean_pcent_cover")
var railways = ee.Image("projects/unep-wcmc/imported/threats/OSM_railways")
var roads_minor = ee.Image("projects/unep-wcmc/imported/threats/GRIP4_GlobalRoads_minor")
// Likely modified
var copernicus_crop_built_pcent_cover_1km = ee.Image("users/joegosling/Nat_mod/test/copernicus_crop_built_pcent_cover_1km")
var quarries_pcover = ee.Image("users/joegosling/Nat_mod/test/quarries_reproj_mean_pcent_cover_1km")
var f_loss_pcover = ee.Image("users/joegosling/Nat_mod/test/forest_loss_1km_pcent_cover")
var roads_major = ee.Image("projects/unep-wcmc/imported/threats/GRIP4_GlobalRoads_major")
// other
var mainlands = ee.FeatureCollection("projects/unep-wcmc/imported/admin_boundaries/gvs_mainlands") //global shoreline
var big_islands = ee.FeatureCollection("projects/unep-wcmc/imported/admin_boundaries/gvs_big_islands") //global shoreline
var water = ee.Image("users/joegosling/Nat_mod/test/water_reproj_pcent_cover_gt50_basemap_clip_1km")
var hfp2013 = ee.Image("users/joegosling/Nat_mod/hfp2013_reclass_WGS84") // Human Footprint Layer

 

///// Select only cells which are more than 50% covered by the feature
// Likely Natural
var ifl_pcover_1km_gt50 = ifl_pcover_1km.gt(5000) 
var wild_pcover_1km_gt50 = wild_pcover_1km.gt(5000)
// Potential Natural
var mangrove_pcover_1km_gt50 = mangrove_pcover_1km.gt(5000)
var saltmarsh_pcover_1km_gt50 = saltmarsh_pcover_1km.gt(5000)
var forest_30_minus_loss_plant_gt50 = forest_minus_loss_plant_30_pcover.gt(5000)
// Potential modified
var lights_pcover_1km_gt50 = nightlights_pcover_1km.gt(5000)
// Likely modified
var crop_built_1km_gt50 = copernicus_crop_built_pcent_cover_1km.gt(5000)
var quarries_pcover_1km_gt50 = quarries_pcover.gt(5000)
var f_loss_pcover_1km_gt50 = f_loss_pcover.gt(5000)
// railways and roads have already been prepared outside of Google Earth Engine

////// merge datasets for each categort together
// Likely Natural
var ln_sum_last = ifl_pcover_1km_gt50.where({test:wild_pcover_1km_gt50, value:wild_pcover_1km_gt50})
var ln_sum_last_4 = ln_sum_last.where(ln_sum_last,4) // give all likely natutal cells a value of 4
Map.addLayer(ln_sum_last_4, {min:0, max:1, palette:["grey","green"]}, 'likely natural',0)
// Potential Natural
var pn_sum = saltmarsh_pcover_1km_gt50.where({test:mangrove_pcover_1km_gt50, value:mangrove_pcover_1km_gt50}) 
var pn_sum_last = pn_sum.where({test:forest_30_minus_loss_plant_gt50, value:forest_30_minus_loss_plant_gt50}) 
var pn_sum_last_3 = pn_sum_last.where(pn_sum_last, 3) // give all potential natutal cells a value of 3
Map.addLayer(pn_sum_last_3, {min:0, max:1, palette:["grey","blue"]}, 'potential natural',0)
// Potential modified
var pm_sum = lights_pcover_1km_gt50.where({test:roads_minor, value:roads_minor}) 
var pm_sum_last = pm_sum.where({test:railways, value:railways}) 
var pm_sum_last_2 = pm_sum_last.where(pm_sum_last, 2) // give all potential modified cells a value of 2
Map.addLayer(pm_sum_last_2, {min:0, max:1, palette:["grey","yellow"]}, 'potential modified',0)
// Likely modified
var lm_sum = crop_built_1km_gt50.where({test:roads_major, value:roads_major})
var lm_sum2 = lm_sum.where({test:f_loss_pcover_1km_gt50, value:f_loss_pcover_1km_gt50})
var lm_sum_last = lm_sum2.where({test:quarries_pcover_1km_gt50, value:quarries_pcover_1km_gt50}) 
var lm_sum_last_1 = lm_sum_last.where(lm_sum_last, 1) // give all likely modified cells a value of 1
Map.addLayer(lm_sum_last_1, {min:0, max:1, palette:["grey","red"]}, 'likely modified',0)

////// combine the 4 layers into a final layer
var final_1 = ln_sum_last_4.where(ln_sum_last_4.eq(0), lm_sum_last_1)
var final_2 = final_1.where(ln_sum_last_4.eq(4).and(lm_sum_last_1.eq(1)), 3)
var final_3 = final_2.where(final_2.eq(0), pn_sum_last_3)
var final_4 = final_3.where(final_3.eq(0), pm_sum_last_2)
var final_hfp = final_4.where(final_4.eq(0), hfp2013) // fill missing cells with Human Footprint Layer


/////// mask out water from screening layer
var final_hfp_water_mask = final_hfp.where(water,0)

/// clip to basemap
var merge_basemap = mainlands.merge(big_islands) // merge mainlands and islands into one
var final_hfp_water_mask_clip = final_hfp_water_mask.clip(merge_basemap)
Map.addLayer(final_hfp_water_mask_clip, {min: 0, max: 4,palette:["white","red","yellow", "blue", "green"]}, 'clipped',0)

////// export final layer to your Google Drive

var targImage = ee.Image("projects/unep-wcmc/imported/Critical_Habitat_Layer/Global_Critical_Habitat_Screening_Layer");
var targScale = targImage.projection().nominalScale().getInfo()

var exportRegion = ee.Geometry.Rectangle([-180, -90, 180, 90], null, false);//global export

Export.image.toDrive({ 
        image: final_hfp_water_mask_clip, 
        region: exportRegion,
        scale: targScale, 
        maxPixels: 10000000000000, 
        folder: "Nataral_modified", 
        description: 'final_hfp_water_mask_clip'
});
