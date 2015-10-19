// title      : Universal Vertex Module
// author     : Karl J. Kangur
// license    : LGPL
// revision   : 1
// file       : universal_vertex_module.jscad

function getParameterDefinitions()
{
  // Parameters accessible for the user
  return [
    {
      name: 'moduletype',
      type: 'choice',
      caption: 'Module type:',
      values: [0, 1],
      captions: ["Square", "Round"],
      initial: 0
    },
    {
      name: 'wallthickness',
      caption: 'Wall thickness (mm):',
      type: 'float',
      initial: 2
    },
    {
      name: 'connectorsize',
      caption: 'Connector size (mm):',
      type: 'float',
      initial: 20
    },
    {
      name: 'connectordepth',
      caption: 'Connector depth (mm):',
      type: 'float',
      initial: 20
    },
    {
      name: 'roundedcorners',
      caption: 'Rounded corners:',
      type: 'choice',
      values: [1, 0],
      captions: ["Yes", "No"],
      initial: 1
    }
  ];
}

function main(params)
{
  // Get the user parameters
  var moduletype = params.moduletype;
  var connectorsize = params.connectorsize;
  var wallthickness = params.wallthickness;
  var connectordepth = params.connectordepth;
  var roundedcorners = params.roundedcorners;

  // Add wall thickness to the connector size to get total module side length
  var totalsidelength = connectorsize + wallthickness * 2;

  // Upper pyramid
  var top_pyramid = polyhedron({
    points: [
      [totalsidelength, totalsidelength, 0],
      [totalsidelength, 0, 0],
      [0, 0, 0],
      [0, totalsidelength, 0],
      [totalsidelength / 2, totalsidelength / 2, totalsidelength / 2]
      ],
    triangles: [
      [0,1,4],
      [1,2,4],
      [2,3,4],
      [3,0,4], 
      [1,0,3],
      [2,1,3]
      ]
    });

  // Must add an offset block or the top holes will go through the bottom of the pyramid
  var offset_block_height = totalsidelength / 5;

  // Add the pyramid to the offset block
  var module_top = union(
    translate([0, 0, offset_block_height], top_pyramid),
    cube([totalsidelength, totalsidelength, offset_block_height])
    );

  // Create the top holes (two intersecting toruses)
  var top_holes = union(
    translate([totalsidelength / 2, totalsidelength / 2 , totalsidelength / 2 + offset_block_height], rotate([0,90,0], torus({ri: 2.5, ro: 1.5*Math.sqrt(2*(totalsidelength / 2)*(totalsidelength / 2)) / 2}))),
    translate([totalsidelength / 2, totalsidelength / 2 , totalsidelength / 2 + offset_block_height], rotate([90,0,0], torus({ri: 2.5, ro: 1.5*Math.sqrt(2*(totalsidelength / 2)*(totalsidelength / 2)) / 2})))
    );

  // Make the holes in the top part
  module_top = difference(module_top, top_holes);

  // Bottom part
  var bottom_outershell = cube([totalsidelength, totalsidelength, connectordepth]);

  // Make the 2 types of connector types
  var bottom_form_square = cube([connectorsize, connectorsize, connectordepth]).translate([wallthickness, wallthickness, 0]);
  var bottom_form_round = translate([totalsidelength / 2, totalsidelength / 2, 0], cylinder({r: connectorsize / 2, h:totalsidelength}));

  // Add the cable-tie holes to the selected form
  var bottom_innerspace = union(
    moduletype == 0 ? bottom_form_square : bottom_form_round,
    translate([0, totalsidelength / 2, connectordepth / 2], rotate([0, 90, 0], cylinder({r: 3, h: totalsidelength}))),
    translate([totalsidelength / 2, totalsidelength, connectordepth / 2], rotate([90, 0, 0], cylinder({r: 3, h: totalsidelength})))
    );

  // Finally substrace the inner form from the external form
  var module_bottom = difference(bottom_outershell, bottom_innerspace);

  // Add the upper pyramid and lower connector together
  var module = union(
    translate([0, 0, connectordepth], module_top),
    module_bottom
    );

  // Total module height
  var total_height = totalsidelength / 2 + connectordepth + offset_block_height;

  // Round the corners
  if(roundedcorners == 1)
  {

    if(moduletype == 0)
    {
      var radius = wallthickness / 2;

      var rounded_corner = difference(
        cube([radius, radius, total_height]),
        cylinder({r: radius, h: total_height})
        );

      module = difference(
        module,
        union(
          translate([totalsidelength - radius, totalsidelength - radius, 0], rotate([0, 0, 0], rounded_corner)),
          translate([radius, radius, 0], rotate([0, 0, 180], rounded_corner)),
          translate([totalsidelength - radius, radius, 0], rotate([0, 0, -90], rounded_corner)),
          translate([radius, totalsidelength - radius, 0], rotate([0, 0, 90], rounded_corner))
          )
        );
    }
    else if(moduletype == 1)
    {
      var hollow_cylinder = difference(
        cube([totalsidelength, totalsidelength, total_height]),
        translate([totalsidelength / 2, totalsidelength / 2, 0], cylinder({r: totalsidelength / 2, h: total_height}))
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
    translate([totalsidelength / 2, 0, 0], cube([totalsidelength, totalsidelength, total_height]))
    );*/
  
  return module.translate([-totalsidelength / 2, -totalsidelength / 2, 0]);
}
