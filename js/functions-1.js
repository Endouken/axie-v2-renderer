var spine;
var axieID = -1;
var oldID;

function togglePause() {
    PIXI.spine.Spine.globalAutoUpdate = !PIXI.spine.Spine.globalAutoUpdate;
}

function downloadImage() {
    var button = document.getElementById('IDButton');
    let canvas = document.getElementById("canvas");
    let dataURL = app.renderer.extract.canvas(app.stage).toDataURL();
    button.href = dataURL;
    button.download = axieID + ".png";
}

function init(transparency) {
    //app = new PIXI.Application(2048, 1024, {backgroundColor : 0x04F404/*,  transparent: true*/ /*0xffffff*/ });
    //app = new PIXI.Application(1024, 1024, { backgroundColor:"transparent", transparent: transparency });
    app = new PIXI.Application(2048, 1024, { backgroundColor: 0x04F404, transparent: transparency });
    app.view.id = "canvas";
    app.view.style.height = 480;
    app.view.style.border = "1px solid #d9d9d9";
    //app.view.style.backgroundColor = "transparent";

    document.getElementById("imageSet").appendChild(app.view);

}
  
function getAxie() {
    oldID = axieID;
    axieID = parseInt($("#axieID").val());
    if (!axieID) {
        //alert("bad axie ID");
        badAxie();
        return;
    }
    if (oldID == axieID) return;
    console.log(axieID);

    baseURL = "https://assets.axieinfinity.com/axies/";
    atlasURL = baseURL + axieID + "/axie/axie.atlas";
    //atlasURL = "https://storage.googleapis.com/assets.axieinfinity.com/axies/" + axieID + "/petite/petite.atlas";
    //imageURL =  data["figure"]["images"][imageName];
    //imageURL =  data["figure"]["axie"]["image"];
    imageURL = baseURL + axieID + "/axie/axie.png";
    //imageURL = "https://storage.googleapis.com/assets.axieinfinity.com/axies/" + axieID + "/petite/petite.png";
    //modelURL = data["figure"]["axie"]["spineModel"];
    modelURL = baseURL + axieID + "/axie/axie.json";
    //modelURL = "https://storage.googleapis.com/assets.axieinfinity.com/axies/" + axieID + "/petite/petite.json";

    let realImageName = imageURL.slice(imageURL.lastIndexOf("/") + 1, imageURL.length);
    PIXI.loader.reset();
    PIXI.loader
        .add('axie_atlas', atlasURL)
        .add('axie_png', imageURL)
        .load(function (loader, resources) {
            //cache false to circumvent server's CORS caching. Server should use Vary: Origin ? or Access-Control-Allow-Origin: *
            $.get({url: modelURL, dataType: "json"}, function(rawSkeletonData) {
                const rawAtlasData = resources['axie_atlas'].data; //your atlas file
                const spineAtlas = new PIXI.spine.core.TextureAtlas(rawAtlasData, function (line, callback) {
                    //use hash name instead of name from file
                    callback(PIXI.BaseTexture.from('axie_png'));
                });

                const spineAtlasLoader = new PIXI.spine.core.AtlasAttachmentLoader(spineAtlas);
                const spineJsonParser = new PIXI.spine.core.SkeletonJson(spineAtlasLoader);

                spineJsonParser.scale = 1;

                delete rawSkeletonData.skins.default.shadow
                console.log(rawSkeletonData)
                
                // aca le pongo que me direccione un boton al tilset del axie
                $('#btn-imagen').attr('href', imageURL);

                spineData = spineJsonParser.readSkeletonData(rawSkeletonData);

                animation = new PIXI.spine.Spine(spineData);

                animation.position.set(app.view.width/2 , app.view.height * 0.85);
                animation.scale.set(0.65, 0.65);
                animation.stateData.setMix("action/idle", "action/appear", 0.2);
                animation.stateData.setMix("action/appear", "action/idle", 0.2);

                animation.stateData.setMix("attack/melee/mouth-bite", "action/idle", 0.2);
                animation.stateData.setMix("action/idle", "attack/melee/mouth-bite", 0.2);

                if (animation.state.hasAnimation('action/idle')) {
                    animation.state.setAnimation(0, 'action/idle', true);
                } else if (animation.state.hasAnimation('action/idle')) {
                    animation.state.setAnimation(0, 'action/idle', true);
                }

                app.stage.removeChildren();
                app.stage.addChild(animation);
                PIXI.spine.Spine.globalAutoUpdate = true;
                app.start();
                setupUI();
               
                animation.state.addListener({
                    event: function(entry, event) { console.log('event fired '+event.data+' at track' + entry.trackIndex) },
                    complete: function(entry) { console.log('track '+entry.trackIndex+' completed '+entry.loopsCount()+' times') },
                    start: function(entry) { 
                        console.log('animation is set at '+entry.trackIndex)                           
                    },
                    end: function(entry) { 
                        console.log('animation was ended at '+entry.trackIndex) 
                    },
                    dispose: function(entry) { console.log('animation was disposed at '+entry.trackIndex) },
                    interrupted: function(entry) { console.log('animation was interrupted at '+entry.trackIndex) }
                });
                  
            }).fail(function() {
                //alert("Failed to get Axie info. Bad Server Config?");
                badAxie();
                $("#axieID").val(oldID);
                axieID = oldID;
                //Aca podria mandar a buscar un axie que si exista
            });
         });
}

function setupUI () {
    var setupAnimationUI = function() {
        var animationList = $("#animationList");
        animationList.empty();
        var activeAnimation = app.stage.children[0].state.tracks[0].animation.name;
        for (var i = 0; i < spineData.animations.length; i++) {
            var name = spineData.animations[i].name;
            var option = $("<option></option>");
            option.attr("value", name).text(name);
            if (name === activeAnimation) option.attr("selected", "selected");
            animationList.append(option);
        }

        animationList.change(function() {
            var animationName = $("#animationList option:selected").text();
            //skeleton.setToSetupPose();
            PIXI.spine.Spine.globalAutoUpdate = true;
            app.stage.children[0].state.setAnimation(0, animationName, true);
            //animation.state.setAnimation(0, 'idle', true);
        })
    }
  setupAnimationUI();
}

init(true);
getAxie();


let renderer, stage;
let capturer = null;

let options = {
    /* Recording options */
    //format: 'gif',
    //framerate: '60FPS',
    format: 'png',
    framerate: '30FPS',    
    start: function(){ startRecording(); },
    stop: function(){ stopRecording(); }
}

var gui = new dat.gui.GUI();

let recording = gui.addFolder('Recording');
//recording.add(options, 'format', ['gif', 'webm-mediarecorder', 'png']); //webm
//recording.add(options, 'framerate', ['10FPS', '30FPS', '60FPS', '120FPS']);
recording.add(options, 'format', ['png']); //webm
recording.add(options, 'framerate', ['30FPS', '60FPS']);
recording.add(options, 'start');
recording.add(options, 'stop');

function initRecording(){
  capturer = new CCapture( {
    verbose: true,
    display: false,
    framerate: parseInt(options.framerate),
    motionBlurFrames: 0,
    quality: 100,
    format: options.format,
    workersPath: 'dist/src/',
    timeLimit: 0,
    frameLimit: 0,
    autoSaveTime: 0,
  } );
}

function startRecording(){
  initRecording();
  capturer.start();
}
function stopRecording(){
  capturer.stop();
  capturer.save();
}


function render(){
  requestAnimationFrame(render);
  // rendering stuff ...
  
  if(capturer) {
      const context = canvas.getContext('webgl');
      context.clear(true)
      context.clearColor(0, 0, 0, 0) 
      capturer.capture( canvas );
  }
}

render()


/* custom */
// $(document).ready(function () {
//     init(true);
// });

/*
let requestAxie =  function() {
    parseInt($("#axieID").val(2595));
    $('#submit-button').click()
}
*/
$('#formulario').on('submit', function (e) {
    e.preventDefault();
    getAxie();
});


// function reload(transparency) {
//     /*
//     $('#canvas').remove();
//     init(transparency);
//     setTimeout(() => {
//         requestAxie()
//     }, 2000);
//     */
//     //localStorage.transparency = transparency
//     //console.log(localStorage ) 
//     //location.reload();
// }


function badAxie() {
    Swal.fire({
        icon: 'error',
        title: 'Failed to get Axie Data',
        text: 'Does this axie really exist?'
      })
}

/*
function reload() {
    $('#canvas').remove();
    init(false, getAxie);
}
*/

/*
localStorage.clear()    // undefined    
console.log(localStorage )           // Storage {length: 0}
*/

/*
$(document).ready(function () {
    localStorage.setItem("axie", parseInt($("#axieID").val(3000))) // Almacena la variable cuyo nombre es nombre y el valor es constructor
    //localStorage.transparency = true; // equivalente al comando anterior
    console.log(localStorage )  // Storage {name: "builder", length: 1}
});
*/