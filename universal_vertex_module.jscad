// title      : Universal Vertex Module
// author     : Karl J. Kangur
// license    : LGPL
// revision   : 1.1
// file       : universal_vertex_module.jscad

function getParameterDefinitions()
{
  // Parameters accessible for the user
  return [
    {
      name: 'module_type',
      type: 'choice',
      caption: 'Module type:',
      values: ["square", "round"],
      captions: ["Square", "Round"],
      initial: 0
    },
    {
      name: 'wall_thickness',
      caption: 'Wall thickness (mm):',
      type: 'float',
      initial: 2
    },
    {
      name: 'connector_size',
      caption: 'Connector size (mm):',
      type: 'float',
      initial: 20
    },
    {
      name: 'connector_depth',
      caption: 'Connector depth (mm):',
      type: 'float',
      initial: 20
    },
    {
      name: 'cable_tie_hole_size',
      caption: 'Cable tie hole size (mm):',
      type: 'float',
      initial: 5
    },
    {
      name: 'rounded_corners',
      caption: 'Rounded corners:',
      type: 'choice',
      values: ["yes", "no"],
      captions: ["Yes", "No"],
      initial: 1
    }
  ];
}

function main(params)
{
  // Get the user parameters
  var module_type = params.module_type;
  var connector_size = params.connector_size;
  var wall_thickness = params.wall_thickness;
  var connector_depth = params.connector_depth;
  var rounded_corners = params.rounded_corners;
  var cable_tie_hole_size = params.cable_tie_hole_size;

  // Add wall thickness to the connector size to get total module side length
  var total_side_length = connector_size + wall_thickness * 2;

  // This is used a lot, so might as well define it...
  var half_side_length = total_side_length / 2;

  // Upper pyramid
  var top_pyramid = polyhedron({
    points: [
      [total_side_length, total_side_length, 0],
      [total_side_length, 0, 0],
      [0, 0, 0],
      [0, total_side_length, 0],
      [half_side_length, half_side_length, half_side_length]
      ],
    triangles: [
      [0, 1, 4],
      [1, 2, 4],
      [2, 3, 4],
      [3, 0, 4], 
      [1, 0, 3],
      [2, 1, 3]
      ]
    });

  // Must add an offset block or the top holes will go through the bottom of the pyramid
  var offset_block_height = total_side_length / 5; // Completely arbitrary, looks like enough...

  // Add the pyramid to the offset block
  var module_top = union(
    translate([0, 0, offset_block_height], top_pyramid),
    cube([total_side_length, total_side_length, offset_block_height])
    );

  // Holes are made using a torus, torus outer radius is related to pyramid size in some funky way
  var top_torus = torus({ri: cable_tie_hole_size / 2, ro: 1.5*Math.sqrt(2 * half_side_length * half_side_length) / 2});

  // Create the top holes (two intersecting toruses)
  var top_holes = union(
    translate([half_side_length, half_side_length, half_side_length + offset_block_height], rotate([0,90,0], top_torus)),
    translate([half_side_length, half_side_length, half_side_length + offset_block_height], rotate([90,0,0], top_torus))
    );

  // Drill the holes in the top part
  module_top = difference(module_top, top_holes);

  // Bottom part
  var bottom_outershell = cube([total_side_length, total_side_length, connector_depth]);

  // Make the 2 types of connector types
  var bottom_form_square = cube([connector_size, connector_size, connector_depth]).translate([wall_thickness, wall_thickness, 0]);
  var bottom_form_round = translate([half_side_length, half_side_length, 0], cylinder({r: connector_size / 2, h:total_side_length}));

  // Add the cable tie holes to the selected form
  var bottom_innerspace = union(
    module_type == "square" ? bottom_form_square : bottom_form_round,
    translate([0, half_side_length, connector_depth / 2], rotate([0, 90, 0], cylinder({r: 3, h: total_side_length}))),
    translate([half_side_length, total_side_length, connector_depth / 2], rotate([90, 0, 0], cylinder({r: 3, h: total_side_length})))
    );

  // Finally substract the inner form from the external form
  var module_bottom = difference(bottom_outershell, bottom_innerspace);

  // Add the upper pyramid and lower connector part together
  var module = union(
    translate([0, 0, connector_depth], module_top),
    module_bottom
    );

  // Evaluate total module height (pyramid + offset + connector)
  var total_height = half_side_length + offset_block_height + connector_depth;

  // Round the corners
  if(rounded_corners == "yes")
  {
    if(module_type == "square")
    {
      // Only round the corners for a square module type
      var radius = wall_thickness / 2;

      var rounded_corner = difference(
        cube([radius, radius, total_height]),
        cylinder({r: radius, h: total_height})
        );

      // Substract the corners from the module
      module = difference(
        module,
        union(
          translate([total_side_length - radius, total_side_length - radius, 0], rotate([0, 0, 0], rounded_corner)),
          translate([radius, radius, 0], rotate([0, 0, 180], rounded_corner)),
          translate([total_side_length - radius, radius, 0], rotate([0, 0, -90], rounded_corner)),
          translate([radius, total_side_length - radius, 0], rotate([0, 0, 90], rounded_corner))
          )
        );
    }
    else if(module_type == "round")
    {
      // Round the whole module for a round module type
      var hollow_cylinder = difference(
        cube([total_side_length, total_side_length, total_height]),
        translate([half_side_length, half_side_length, 0], cylinder({r: half_side_length, h: total_height}))
        );

      module = difference(
        module,
        hollow_cylinder
        );
    }
  }

  // Comment out to see inside the module
  /*module = difference(
    module,
    translate([half_side_length, 0, 0], cube([total_side_length, total_side_length, total_height]))
    );*/
  
  return module.translate([-half_side_length, -half_side_length, 0]);
}
