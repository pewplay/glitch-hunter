/*
 * Glitch Hunter
 * Based on "Evil Glitch" by Giovanni Beltran (@agar3s), js13kGames 2016 (ISC license).
 * Art direction and logo style: Lorena Marquez.
 * Bootstrap, WebGL helpers and build layout adapted from "Behind Asteroids" by Gaëtan Renaudeau (@gre).
 * Adapted for PewPlay: responsive canvas, touch controls, audio unlock, pause on hidden tab.
 */
(function () {

// ---- lib/geometry.js

function getAngle(p1, p2){
  return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}

function getHypo(p1, p2){
  return Math.sqrt(p1*p1+p2*p2)
}

// ---- lib/webgl.js
/*
* original script from @gre 
* https://github.com/gre/behind-asteroids/blob/master/src/lib/webgl.sh
*/
function glCreateShader (vert, frag) {
  var handle, type = gl.VERTEX_SHADER, src = vert;
  handle = gl.createShader(type);
  gl.shaderSource(handle, src);
  gl.compileShader(handle);
  var vertex = handle;

  type = gl.FRAGMENT_SHADER;
  src = frag;
  handle = gl.createShader(type);
  gl.shaderSource(handle, src);
  gl.compileShader(handle);
  var fragment = handle;


  var program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);


  gl.useProgram(program);
  var p = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  return [program];
}
function glBindShader (shader) {
  gl.useProgram(shader[0]);
}
function glUniformLocation(shader, name) {
  return shader[name] || (shader[name] = gl.getUniformLocation(shader[0], name));
}
function glCreateTexture () {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
function glSetTexture (t, value) {
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, value);
}
function glBindTexture (t, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  return unit;
}
function glCreateFBO () {
  var handle = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, handle);
  var color = glCreateTexture();
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  return [handle, color];
}
function glBindFBO (fbo) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);
}
function glGetFBOTexture (fbo) {
  return fbo[1];
}

// PewPlay: resize the color texture of a framebuffer (on window resize)
function glResizeFBO (fbo, w, h) {
  gl.bindTexture(gl.TEXTURE_2D, fbo[1]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
}


// ---- lib/jsfxr.js
/**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */

 /* eslint-disable */

/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param array Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.ss = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
      this[String.fromCharCode( 97 + i )] = values[i] || 0;
    }

    // I moved this here from the r(true) function
    if (this['c'] < .01) {
      this['c'] = .01;
    }

    var totalTime = this['b'] + this['c'] + this['e'];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this['b']  *= multiplier;
      this['c'] *= multiplier;
      this['e']   *= multiplier;
    }
  }
}

/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._p = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * rs the runing variables from the params
   * Used once at the start (total r) and for the repeat effect (partial r)
   */
  this.r = function() {
    // Shorter reference
    var p = this._p;

    _period       = 100 / (p['f'] * p['f'] + .001);
    _maxPeriod    = 100 / (p['g']   * p['g']   + .001);

    _slide        = 1 - p['h'] * p['h'] * p['h'] * .01;
    _deltaSlide   = -p['i'] * p['i'] * p['i'] * .000001;

    if (!p['a']) {
      _squareDuty = .5 - p['n'] / 2;
      _dutySweep  = -p['o'] * .00005;
    }

    _changeAmount =  1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
  }

  // I split the r() function into two functions for better readability
  this.tr = function() {
    this.r();

    // Shorter reference
    var p = this._p;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p['b']  * p['b']  * 100000;
    _envelopeLength1 = p['c'] * p['c'] * 100000;
    _envelopeLength2 = p['e']   * p['e']   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.sw = function(buffer, length) {
    // Shorter reference
    var p = this._p;

    // If the filters are active
    var _filters = p['s'] != 1 || p['v'],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'],
        // Minimum frequency before stopping
        _minFreqency = p['g'],
        // If the phaser is active
        _phaser = p['q'] || p['r'],
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are r
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01,
        // The type of wave to generate
        _waveType = p['a'];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for (var i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for (var i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = getRandomValue(2,-1);
    }

    for (var i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially rting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.r();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit) {
        if (++_changeTime >= _changeLimit) {
          _changeLimit = 0;
          _period *= _changeAmount;
        }
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
        _squareDuty += _dutySweep;
        if (_squareDuty < 0) {
          _squareDuty = 0;
        } else if (_squareDuty > .5) {
          _squareDuty = .5;
        }
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;

        switch (++_envelopeStage)  {
          case 1:
            _envelopeLength = _envelopeLength1;
            break;
          case 2:
            _envelopeLength = _envelopeLength2;
        }
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
        _hpFilterCutoff *= _hpFilterDeltaCutoff;
        if (_hpFilterCutoff < .00001) {
          _hpFilterCutoff = .00001;
        } else if (_hpFilterCutoff > .1) {
          _hpFilterCutoff = .1;
        }
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = getRandomValue(2,-1);
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
          _lpFilterCutoff *= _lpFilterDeltaCutoff;
          if (_lpFilterCutoff < 0) {
            _lpFilterCutoff = 0;
          } else if (_lpFilterCutoff > .1) {
            _lpFilterCutoff = .1;
          }

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();
// PewPlay: returns the WAV file as an ArrayBuffer (decoded later, after the audio unlock)
function jsfxr (settings) {
  // Initialize SfxrParams
  synth._p.ss(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.tr();
  var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);

  var used = synth.sw(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;

  var dv = new Uint32Array(data.buffer, 0, 44);
  // Initialize header
  dv[0] = 0x46464952; // "RIFF"
  dv[1] = used + 36;  // put total size here
  dv[2] = 0x45564157; // "WAVE"
  dv[3] = 0x20746D66; // "fmt "
  dv[4] = 0x00000010; // size of the following
  dv[5] = 0x00010001; // Mono: 1 channel, PCM format
  dv[6] = 0x0000AC44; // 44,100 samples per second
  dv[7] = 0x00015888; // byte rate: two bytes per sample
  dv[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
  dv[9] = 0x61746164; // "data"
  dv[10] = used;      // put number of samples here

  return data.buffer.slice(0, used + 44);
}


// ---- lib/TinyMusic.js
/*
 * Private stuffz
 */

var enharmonics = 'B#-C|C#-Db|D|D#-Eb|E-Fb|E#-F|F#-Gb|G|G#-Ab|A|A#-Bb|B-Cb',
  middleC = 440 * Math.pow( Math.pow( 2, 1 / 12 ), -9 ),
  numeric = /^[0-9.]+$/,
  octaveOffset = 4,
  space = /\s+/,
  num = /(\d+)/,
  offsets = {};

// populate the offset lookup (note distance from C, in semitones)
enharmonics.split('|').forEach(function( val, i ) {
  val.split('-').forEach(function( note ) {
    offsets[ note ] = i;
  });
});

/*
 * Note class
 *
 * new Note ('A4 q') === 440Hz, quarter note
 * new Note ('- e') === 0Hz (basically a rest), eigth note
 * new Note ('A4 es') === 440Hz, dotted eighth note (eighth + sixteenth)
 * new Note ('A4 0.0125') === 440Hz, 32nd note (or any arbitrary
 * divisor/multiple of 1 beat)
 *
 */

// create a new Note instance from a string
function Note( str ) {
  var couple = str.split( space );
  // frequency, in Hz
  this.frequency = Note.getFrequency( couple[ 0 ] ) || 0;
  // duration, as a ratio of 1 beat (quarter note = 1, half note = 0.5, etc.)
  this.duration = Note.getDuration( couple[ 1 ] ) || 0;
}

// convert a note name (e.g. 'A4') to a frequency (e.g. 440.00)
Note.getFrequency = function( name ) {
  var couple = name.split( num ),
    distance = offsets[ couple[ 0 ] ],
    octaveDiff = ( couple[ 1 ] || octaveOffset ) - octaveOffset,
    freq = middleC * Math.pow( Math.pow( 2, 1 / 12 ), distance );
  return freq * Math.pow( 2, octaveDiff );
};

// convert a duration string (e.g. 'q') to a number (e.g. 1)
// also accepts numeric strings (e.g '0.125')
// and compund durations (e.g. 'es' for dotted-eight or eighth plus sixteenth)
Note.getDuration = function( symbol ) {
  return numeric.test( symbol ) ? parseFloat( symbol ) :
    symbol.toLowerCase().split('').reduce(function( prev, curr ) {
      return prev + ( curr === 'w' ? 4 : curr === 'h' ? 2 :
        curr === 'q' ? 1 : curr === 'e' ? 0.5 :
        curr === 's' ? 0.25 : 0 );
    }, 0 );
};

/*
 * Sequence class
 */

// create a new Sequence
function Sequence( ac, tempo, arr ) {
  this.ac = ac || new AudioContext();
  this.createFxNodes();
  this.tempo = tempo || 120;
  this.loop = true;
  this.smoothing = 0;
  this.staccato = 0;
  this.notes = [];
  this.push.apply( this, arr || [] );
}

// create gain and EQ nodes, then connect 'em
Sequence.prototype.createFxNodes = function() {
  var eq = [ [ 'bass', 100 ], [ 'mid', 1000 ], [ 'treble', 2500 ] ],
    prev = this.gain = this.ac.createGain();
  eq.forEach(function( config, filter ) {
    filter = this[ config[ 0 ] ] = this.ac.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = config[ 1 ];
    prev.connect( prev = filter );
  }.bind( this ));
  prev.connect( musicOut || this.ac.destination ); // PewPlay: through the master (mute) gain
  return this;
};

// accepts Note instances or strings (e.g. 'A4 e')
Sequence.prototype.push = function() {
  Array.prototype.forEach.call( arguments, function( note ) {
    this.notes.push( note instanceof Note ? note : new Note( note ) );
  }.bind( this ));
  return this;
};

// create a custom waveform as opposed to "sawtooth", "triangle", etc
Sequence.prototype.createCustomWave = function( real, imag ) {
  // Allow user to specify only one array and dupe it for imag.
  if ( !imag ) {
    imag = real;
  }

  // Wave type must be custom to apply period wave.
  this.waveType = 'custom';

  // Reset customWave
  this.customWave = [ new Float32Array( real ), new Float32Array( imag ) ];
};

// recreate the oscillator node (happens on every play)
Sequence.prototype.createOscillator = function() {
  this.stop();
  this.osc = this.ac.createOscillator();

  // customWave should be an array of Float32Arrays. The more elements in
  // each Float32Array, the dirtier (saw-like) the wave is
  if ( this.customWave ) {
    this.osc.setPeriodicWave(
      this.ac.createPeriodicWave.apply( this.ac, this.customWave )
    );
  } else {
    this.osc.type = this.waveType || 'square';
  }

  this.osc.connect( this.gain );
  return this;
};

// schedules this.notes[ index ] to play at the given time
// returns an AudioContext timestamp of when the note will *end*
Sequence.prototype.scheduleNote = function( index, when ) {
  var duration = 60 / this.tempo * this.notes[ index ].duration,
    cutoff = duration * ( 1 - ( this.staccato || 0 ) );

  this.setFrequency( this.notes[ index ].frequency, when );

  if ( this.smoothing && this.notes[ index ].frequency ) {
    this.slide( index, when, cutoff );
  }

  this.setFrequency( 0, when + cutoff );
  return when + duration;
};

// get the next note
Sequence.prototype.getNextNote = function( index ) {
  return this.notes[ index < this.notes.length - 1 ? index + 1 : 0 ];
};

// how long do we wait before beginning the slide? (in seconds)
Sequence.prototype.getSlideStartDelay = function( duration ) {
  return duration - Math.min( duration, 60 / this.tempo * this.smoothing );
};

// slide the note at <index> into the next note at the given time,
// and apply staccato effect if needed
Sequence.prototype.slide = function( index, when, cutoff ) {
  var next = this.getNextNote( index ),
    start = this.getSlideStartDelay( cutoff );
  this.setFrequency( this.notes[ index ].frequency, when + start );
  this.rampFrequency( next.frequency, when + cutoff );
  return this;
};

// set frequency at time
Sequence.prototype.setFrequency = function( freq, when ) {
  this.osc.frequency.setValueAtTime( freq, when );
  return this;
};

// ramp to frequency at time
Sequence.prototype.rampFrequency = function( freq, when ) {
  this.osc.frequency.linearRampToValueAtTime( freq, when );
  return this;
};

// run through all notes in the sequence and schedule them
Sequence.prototype.play = function( when ) {
  when = typeof when === 'number' ? when : this.ac.currentTime;
  this.createOscillator();
  this.osc.start( when );

  this.notes.forEach(function( note, i ) {
    when = this.scheduleNote( i, when );
  }.bind( this ));

  this.osc.stop( when );
  this.osc.onended = this.loop ? this.play.bind( this, when ) : null;

  return this;
};

// stop playback, null out the oscillator, cancel parameter automation
Sequence.prototype.stop = function() {
  if ( this.osc ) {
    this.osc.onended = null;
    this.osc.disconnect();
    this.osc = null;
  }
  return this;
};


// ---- lib/font.js
/**
* custom font 14 segment letter
*/
var mapLetters = '0123456789?abcdefghijklmnopqrstuvwxyz .-\'/';
var letters = [8767,518,1115,1039,1126,1133,1149,7,1151,1135,5123,1143,5391,57,4367,121,113,1085,1142,4361,30,2672,56,694,2230,63,1139,2111,3187,1133,4353,62,8752,10294,10880,4736,8713,0,16,1088,256,8704];

function drawSegment(xi,yi,offsetX,offsetY){
  ctx.moveTo(xi,yi);
  ctx.lineTo(xi+offsetX,yi+offsetY);
}

function drawLetter14Segments(letter, x, y, size){
  var size4 = size-4;
  var size24 = size/2-4;
  // *****
  // |\|/|
  // -- --
  // |\|/|
  // *****
  if(letter&1){
    drawSegment(x+2, y-1,size4, 0);
  }
  // ---
  // |\/*
  //  --
  // |\/|
  // ---
  if(letter&2){
    drawSegment(size+x+1, y,0, size-1);
  }
  // ---
  // |\/|
  //  --
  // |\/*
  // ---
  if(letter&4){
    drawSegment(size+x+1, size+y+1,0, size-1);
  }
  // ---
  // |\/|
  //  --
  // |\/|
  // ***
  if(letter&8){
    drawSegment(x+2, size*2+y+1,size4, 0);
  }
  // ---
  // |\/|
  //  --
  // *\/|
  // ---
  if(letter&16){
    drawSegment(x-1, y+size+1,0, size-1);
  }
  // ---
  // *\/|
  //  --
  // |\/|
  // ---
  if(letter&32){
    drawSegment(x-1, y,0, size-1);
  }
  // ---
  // |\/|
  //  *-
  // |\/|
  // ---
  if(letter&64){
    drawSegment(x+2, size+y,size24, 0);
  }
  // ---
  // |*/|
  //  --
  // |/|\|
  // ---
  if(letter&128){
    drawSegment(x+2, y+2,size24, size4);
  }
  // -----
  // |\*/|
  // -- --
  // |/|\|
  // -----
  if(letter&256){
    drawSegment(size/2+x, y+2,0, size4);
  }
  // -----
  // |\|*|
  // -- --
  // |/|\|
  // -----
  if(letter&512){
    drawSegment(size+x-2, y+2,-size24, size4);
    //drawSegment(size/2+x+2, size+y-2,size24, size+4);
  }
  // -----
  // |\|/|
  // -- **
  // |/|\|
  // -----
  if(letter&1024){
    drawSegment(size/2+x+2, size+y,size24, 0);
  }
  // -----
  // |\|/|
  // -- --
  // |/|*|
  // -----
  if(letter&2048){
    drawSegment(size/2+x+2, size+y+2,size24, size4);
  }
  // -----
  // |\|/|
  // -- --
  // |/*\|
  // -----
  if(letter&4096){
    drawSegment(size/2+x, size+y+2,0, size4);
  }
  // -----
  // |\|/|
  // -- --
  // |*|\|
  // -----
  if(letter&8192){
    drawSegment(x+2, size*2+y-2,size24, -size+4);
  }
}
function drawWord(word, x, y, size, colorIndex, spacing){
  ctx.save();
  ctx.beginPath();
  setContextAtrribute(colorIndex);
  for (var i = 0; i < word.length; i++) {
    drawLetter14Segments(letters[mapLetters.indexOf(word[i])], shakeScreen[0]+x-(size+spacing)*(word.length-i), shakeScreen[1]+y, size);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function drawWordCenter(word, x, y, size, colorIndex,spacing){
  x += (size+spacing)*word.length/2
  drawWord(word, x, y, size, colorIndex, spacing)
}
function drawWordLeft(word, x, y, size, colorIndex, spacing){
  x += (size+spacing)*word.length;
  drawWord(word, x, y, size, colorIndex, spacing)
}
var wordAligns=[drawWordCenter,drawWord];

function displayWord(word, x, y, size, colorIndexes, side, width){
  width = width||colorIndexes.length;
  side = side||0;
  var spacing = size<25?10:size*0.5;
  for (var i = 0; i < width; i++) {
    wordAligns[side](word, x+i, y+i, size, colorIndexes[i]||colorIndexes[0], spacing);
  }
}

// PewPlay: largest size <= maxSize for which the word fits in maxWidth logical pixels
function fitWordSize(word, maxSize, maxWidth){
  var n = Math.max(1, word.length);
  var size = maxSize;
  if (size >= 25 && n * size * 1.5 > maxWidth) size = maxWidth / (n * 1.5);
  if (size < 25 && n * (size + 10) > maxWidth) size = maxWidth / n - 10;
  return Math.max(4, size);
}


// ---- lib/ease.js
//ease functions from http://gizma.com/easing
var linearTween = function (t, b, c, d) {
  return c*t/d + b;
};
var easeInQuad = function (t, b, c, d) {
  t /= d;
  return c*t*t + b;
};
var easeOutQuad = function (t, b, c, d) {
  t /= d;
  return -c * t*(t-2) + b;
};

var easeOutCirc = function (t, b, c, d) {
  t /= d;
  t--;
  return c * Math.sqrt(1 - t*t) + b;
};

// ---- lib/spatialhashing.js
// custom spatialhashing implementation

var spatialhashing = {};
var ceilHeight = 84;
function getHashItem(item){
  return Math.round(item[0]/ceilHeight)+'-'+Math.round(item[1]/ceilHeight);
}
/* add element to spatialhash*/
function addItem(item){
  var hash = getHashItem(item);
  spatialhashing[hash]=spatialhashing[hash]||[];
  spatialhashing[hash].push(item);
}

function getHash(x,y){
  return getHashItem([x, y]);
}
/* return elements that collides with element*/
/* only the first element that collides*/
function collideElements(item){
  var list = {};
  var elements = [];
  for (var i = 0; i < 9; i++) {
    var hash = getHash(item[0]+(i%3-1)*ceilHeight, item[1]+(~~(i/3)-1)*ceilHeight);
    if(!list[hash]){
      list[hash]=1;
      var elements = spatialhashing[hash];
      for (var i = 0; elements&&i < elements.length; i++) {
        if(getHypo(item[1]-elements[i][1], item[0]-elements[i][0])<elements[i][2]+item[2]){
          return elements[i]
        }
      }
    }
  }

}

// ---- shaders
var BADCOLOR_FRAG = `
precision highp float;
uniform vec2 dim;
uniform sampler2D tex;
varying vec2 uv;
uniform float time;
uniform vec3 colors;

// bad color
// play with rand,
// and colors to display, rgb, rb, rg, gb, r, g, b
// this glitch requires a black cortain like the one in gameover
void main (){
  float rand = sin(time);
  vec4 col = texture2D(tex, uv);
  vec4 col_r = texture2D(tex, uv + vec2((-15. / dim.x), 0));
  vec4 col_l = texture2D(tex, uv + vec2((15. / dim.x), 0));
  vec4 col_g = texture2D(tex, uv + vec2((-7.5 / dim.x), 0));
  if(colors.r==1.){
    col.r = col.r + col_l.r * max(1., sin(uv.y * dim.y * 1.2)) * rand;
  }
  if(colors.g==1.){
   col.b = col.b + col_r.b * max(1., sin(uv.y * dim.y * 1.2)) * rand;
  }
  if(colors.b==1.){
   col.g = col.g + col_g.g * max(1., sin(uv.y * dim.y * 1.2)) * rand;
  }
   gl_FragColor.rgba = col.rgba;
}`;
var CRT_FRAG = `
precision highp float;
uniform vec2 dim;
uniform sampler2D tex;
varying vec2 uv;
uniform float time;
uniform vec3 colors;

void main() {
    vec2 coord = uv * dim;
    coord -= dim/2.;
    float dis = length(coord);
    if (dis < 600.) {
        float percent = dis / 600.;
        coord *= mix(1., smoothstep(0.0, 600. / dis, percent), .125);
    }
    coord += dim/2.;
    vec4 color = texture2D(tex, coord / dim);

    float dist = distance(uv, vec2(.5, .5));
    color.rgb *= smoothstep(.8, .2*.8, dist);

    gl_FragColor = color;

}
`;
var CUT_FRAG = `
precision highp float;
uniform vec2 dim;
uniform sampler2D tex;
varying vec2 uv;
uniform float time;
uniform vec3 colors;

// cut slide nice glitch!
// play with rand and val1 val2 
void main (){
   float val1 = 5.;
   float val2 = .5;
   vec2 pos = uv * dim;
   vec2 posOffset = pos + vec2(floor(sin(pos.y / val1 * time + time * time)) * val2 * time, 0);
   posOffset = posOffset / dim;
   vec4 col = texture2D(tex, posOffset);
   gl_FragColor.rgba = col.rgba;
}`;
var GLOW_FRAG = `
precision highp float;
uniform vec2 dim;
uniform sampler2D tex;
varying vec2 uv;
uniform float time;
uniform vec3 colors;

void main (){ 
   vec2 pos = uv * dim;
   vec4 col = texture2D(tex, uv);
   vec4 gws = vec4(.0);
   float rand = .02*sin(time)+.3;
   float weight = .03;
   
   vec4 col_r = texture2D(tex, uv + vec2((-15. / dim.x) * rand, 0));
   //glow
   for (int i = 0; i <9; i++) {
     float miw = float(mod(float(i), 4.));
     float idw = float(i / 3);
     vec2 v1 = vec2(pos.x + miw, pos.y + idw);
     vec2 v2 = vec2(pos.x - miw, pos.y + idw);
     vec2 v3 = vec2(pos.x + miw, pos.y - idw);
     vec2 v4 = vec2(pos.x - miw, pos.y - idw);
     gws += texture2D(tex, v1 / dim) * weight;
     gws += texture2D(tex, v2 / dim) * weight;
     gws += texture2D(tex, v3 / dim) * weight;
     gws += texture2D(tex, v4 / dim) * weight;
   }
   col += gws;
   // chromatic distorsion 
   vec4 col_l = texture2D(tex, uv + vec2((8. / dim.x) * rand, 0));
   vec4 col_g = texture2D(tex, uv + vec2((-7.5 / dim.x) * rand, 0));
   float val = max(1., sin(uv.y * dim.y * 1.2) * 2.5) * rand;
   col.r = col.r + col_l.r * val;
   col.b = col.b + col_r.b * val;
   col.g = col.g + col_g.g * val;

   // Noise color using random number
   vec2 pos2 = uv*sin(time);
   float r = fract(sin(dot(pos2.xy ,vec2(12.,78.))) * 43758.);
   vec3 noise = vec3(r);
   col.rgb = mix(col.rgb, noise, .015);



   gl_FragColor.rgba = col;
}
`;
var SLIT_FRAG = `
precision highp float;
uniform vec2 dim;
uniform sampler2D tex;
varying vec2 uv;
uniform float time;
uniform vec3 colors;

// SlitScanFilter
// play with time
void main (){
   vec2 pos = uv * dim;
   vec2 texCoord = vec2(3.+floor(pos.x/time)*time ,pos.y);
   vec4 col = texture2D(tex, texCoord / dim);
   gl_FragColor.rgba = col.rgba;
} 
`;
var SWELL_FRAG = `
precision highp float;
uniform vec2 dim;
uniform sampler2D tex;
varying vec2 uv;
uniform float time;
uniform vec3 colors;

// effects for enemies, totems and corruption
void main (){
   vec4 col_s = texture2D(tex, uv);
   if(time==.0){
   	gl_FragColor.rgba = col_s.bgra;
   }else{
   	gl_FragColor.rgba = col_s.rgba;
   }
   
}
`;
var TWIST_FRAG = `
precision highp float;
uniform vec2 dim;
uniform sampler2D tex;
varying vec2 uv;
uniform float time;
uniform vec3 colors;

// twist glitch temp
// 4 values to play...
void main (){
   float rand = .3; //2.3
   float timer = .3; // 11.0
   float val2 = 10.*time;  //2.5
   float val3 = 10.*time; //167.0
   float trueWidth = dim.x;
   float trueHeight = dim.y;
   vec2 pos = uv * dim;
   vec2 texCoord = vec2(max(3., min(float(trueWidth), pos.x + sin(pos.y / (153.25 * rand * rand) * rand + rand * val2 + timer * 3.) * val3)), max(3., min(float(trueHeight), pos.y + cos(pos.x/(251.57 * rand * rand) * rand + rand * val2 + timer * 2.4) * val3)- 3.));
   vec4 col = texture2D(tex, texCoord / dim);
   gl_FragColor.rgba = col.rgba;
}`;
var STATIC_VERT = `
attribute vec2 p;
varying vec2 uv;

void main() {
  gl_Position = vec4(p,.0,1.);
  uv = .5 * (p+1.);
}
`;

// ---- setup.js
/*
* original setup script from @gre
* https://github.com/gre/behind-asteroids/blob/master/src/setup.js
* PewPlay: the logical view (FW x FH) adapts to the shape of the screen
* (800x600 .. 900x600 in landscape, 600x800 .. 600x900 in portrait) and the
* canvases are rendered at device resolution.
*/
var c = document.getElementById('c'),
  g = document.getElementById('g'),
  stage = document.getElementById('stage');

var STORE_PREFIX = 'glitch-hunter:';
var storage = {
  getItem: function (key) {
    try { return window.localStorage.getItem(STORE_PREFIX + key); } catch (e) { return null; }
  },
  setItem: function (key, value) {
    try { window.localStorage.setItem(STORE_PREFIX + key, value); } catch (e) { /* storage unavailable */ }
  }
};

var glprops = {preserveDrawingBuffer: true, antialias: false};
var gl = c.getContext('webgl', glprops) || c.getContext('experimental-webgl', glprops),
  ctx = g.getContext('2d'),
  FW = 800,
  FH = 600,
  W = FW,
  H = FH,
  RS = 1,              // render scale (device pixels per logical pixel)
  displayScale = 1,    // css pixels per logical pixel
  portrait = false,
  shakeScreen = [0, 0],
  glitchTime = 0,
  frame = 0,
  dt = 1 / 60,
  t = 0,
  wave = 1,
  record = 0,
  GLITCHS = [0, 0, 0, 0, 0, 0, 0],
  godMode = false,
  godModeAvailable = !!storage.getItem('hunter-mode'),
  startFromGodMode = false;

if (!gl) {
  document.getElementById('nogl').style.display = 'flex';
  throw new Error('WebGL is not available');
}

// WebGL setup
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1.0, -1.0,
  1.0, -1.0,
  -1.0,  1.0,
  -1.0,  1.0,
  1.0, -1.0,
  1.0,  1.0
]), gl.STATIC_DRAW);

var glowShader = glCreateShader(STATIC_VERT, GLOW_FRAG);
var crtShader = glCreateShader(STATIC_VERT, CRT_FRAG);
var badColorShader = glCreateShader(STATIC_VERT, BADCOLOR_FRAG);
var cutShader = glCreateShader(STATIC_VERT, CUT_FRAG);
var twistShader = glCreateShader(STATIC_VERT, TWIST_FRAG);
var swellShader = glCreateShader(STATIC_VERT, SWELL_FRAG);
var slitShader = glCreateShader(STATIC_VERT, SLIT_FRAG);
var allShaders = [glowShader, crtShader, badColorShader, cutShader, twistShader, swellShader, slitShader];

var fbo1 = glCreateFBO();
var fbo2 = glCreateFBO();

var textureGame = glCreateTexture();

var layoutListeners = [];
function resize() {
  var vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight);
  var aspect = vw / vh;
  portrait = aspect < 1;
  if (portrait) {
    FW = 600;
    FH = Math.round(Math.min(900, Math.max(800, 600 / aspect)));
  } else {
    FH = 600;
    FW = Math.round(Math.min(900, Math.max(800, 600 * aspect)));
  }
  W = FW; H = FH;
  displayScale = Math.min(vw / FW, vh / FH);
  var dpr = window.devicePixelRatio || 1;
  RS = Math.max(0.5, Math.min(displayScale * dpr, 2));
  var pw = Math.round(FW * RS), ph = Math.round(FH * RS);
  c.width = g.width = pw;
  c.height = g.height = ph;
  var cssW = FW * displayScale, cssH = FH * displayScale;
  c.style.width = cssW + 'px';
  c.style.height = cssH + 'px';
  c.style.left = ((vw - cssW) / 2) + 'px';
  c.style.top = ((vh - cssH) / 2) + 'px';

  glResizeFBO(fbo1, pw, ph);
  glResizeFBO(fbo2, pw, ph);
  gl.viewport(0, 0, pw, ph);
  for (var i = 0; i < allShaders.length; i++) {
    glBindShader(allShaders[i]);
    gl.uniform2f(glUniformLocation(allShaders[i], 'dim'), FW, FH);
  }
  for (var j = 0; j < layoutListeners.length; j++) layoutListeners[j]();
}


// ---- lib/audio.js
/* global jsfxr */
// PewPlay: the AudioContext is created only after the first user gesture
// (unlockAudio), sounds are synthesized up front and decoded at unlock time.

var AudioCtor = window.AudioContext || window.webkitAudioContext;
var audioCtx = null, audioDest = null, masterGain = null, musicOut = null;
var pendingSounds = [];
var muted = storage.getItem('muted') === '1';
var audioReadyListeners = [];

function audio(conf) {
  var o = [];
  o.data = jsfxr(conf);
  pendingSounds.push(o);
  return o;
}

function decodeSound(o) {
  var copy = o.data.slice(0);
  try {
    var result = audioCtx.decodeAudioData(copy, function (buf) { o[0] = buf; }, function () {});
    if (result && result.catch) result.catch(function () {});
  } catch (e) { /* ignore */ }
}

function unlockAudio() {
  if (!AudioCtor) return;
  if (audioCtx) {
    if (audioCtx.state === 'suspended' && !document.hidden) audioCtx.resume().catch(function () {});
    return;
  }
  audioCtx = new AudioCtor();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = muted ? 0 : 1;
  masterGain.connect(audioCtx.destination);
  audioDest = audioCtx.createDynamicsCompressor();
  var gain = audioCtx.createGain();
  gain.gain.value = !!window.chrome ? 0.2 : 0.4;
  audioDest.connect(gain);
  gain.connect(masterGain);
  musicOut = masterGain;
  for (var i = 0; i < pendingSounds.length; i++) decodeSound(pendingSounds[i]);
  for (var j = 0; j < audioReadyListeners.length; j++) audioReadyListeners[j]();
}

function setMuted(value) {
  muted = value;
  storage.setItem('muted', muted ? '1' : '0');
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
}

function play(o) {
  if (!audioCtx || !o[0] || audioCtx.state !== 'running') return;
  var source = audioCtx.createBufferSource();
  source.buffer = o[0];
  source.connect(audioDest);
  source.start(0);
  setTimeout(function () {
    source.disconnect();
  }, o[0].duration * 1000 + 300);
}


// ---- colors.js
// colors
var colors = [
'#FFF',//0 white
'rgba(40,77,153,0.6)', //1 normal
'rgba(234,34,37,0.6)',//2 corruption or  'rgba(231,197,11,0.3)';
'rgba(180,0,50,0.3)',//3 red eye for flower of life
'#F952FF',//4 cursor color
'rgba(0,77,153,0.6)',//5 soft  white line to glow 
'rgb(72,255,206)',//6 hero
'rgba(0,0,0,0.1)',//7f screen cleaner
'rgba(7,8,12,0.2)',// 8f corruption background
'rgb(40,145,160)',//9f bullet color
'#F66', //10 button start again
'#69F', //11 (unused)
'#32F', //12 (unused)
'#6FF',  //13 button fire to start& controls
'#066',  //14 stroke line buttons
'#0FF', //15 hit enemy strokeline
'rgba(235,118,71,0.8)', //16 enemy stroke release
'#559',  //17 enemy stroke charging,
'#F6F', //18 colors glow ,
'#2F2', //19 score color,
'#000',//20 message color1 
'#973',//21 message color1,
'rgba(0,0,0,0.71)',//22 darken
'rgb(2,1,2)',//23 splash background
'rgba(255,102,192,0.8)',//24 enemy 1
'rgba(255,102,102,0.8)',//25 enemy 2
//'rgba(235,118,71,0.8)',//25 enemy 2
'rgba(252,233,128,0.8)',//26 enemy 3
'rgba(150,127,254,0.8)',//27 enemy 4
'rgba(179,72,108,0.8)',//28 enemy 5 guardian
'rgba(179,88,52,0.8)',//29 enemy 6 bullet
'rgba(128,108,26,0.8)',//30 enemy 7
'rgba(128,155,15,0.8)',//31 enemy 8
'rgba(128,131,51,0.8)',//32 enemy 9
'hsla(324,50%, 60%, 0.88)',//33 enemy 10
'hsla(360,50%, 60%, 0.88)',//34 enemy 11
'hsla(10,50%, 60%, 0.88)',//35 enemy 12
'hsla(20,50%, 60%, 0.88)',//36 enemy 13
'hsla(30,50%, 60%, 0.88)',//37 enemy 14
'rgba(7,8,12,0.2)'  //38
];

function setContextAtrribute(index,attribute, custom){
  ctx[['strokeStyle','fillStyle','lineWidth'][attribute||0]] = custom||colors[index];
}
/**enemies must have colors?*/
function setRandomColor(r,r2,g,g2,b,b2,a,a2){
  var value =  'rgba('+~~getRandomValue(r,r2)+','+~~getRandomValue(g,g2)+','+~~getRandomValue(b,b2)+','+getRandomValue(a,a2)+')';
  setContextAtrribute(-1,1,value);
}

// ---- effects.js
/*
* original script from @gre
* https://github.com/gre/behind-asteroids/blob/master/src/effects.sh
*/

function setFrameBuffer(param1, param2, shader,time,colors){
  glBindFBO(param1);
  glBindShader(shader);
  gl.uniform1i(glUniformLocation(shader, 'tex'), glBindTexture(param2, 0));
  if(time!=undefined){
    gl.uniform1f(glUniformLocation(shader, 'time'), time);
  }
  if(colors){
    gl.uniform3fv(glUniformLocation(shader, 'colors'),colors);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 6);  
}
function drawPostProcessing () {
  glSetTexture(textureGame, g);

  setFrameBuffer(fbo1,textureGame, badColorShader, (frame/60)%180, [(glitchTime+1>0||GLITCHS[0]>0)?1:0,(glitchTime+2>0||GLITCHS[1]>0)?1:0,(glitchTime>0||GLITCHS[2]>0)?1:0]);
  setFrameBuffer(fbo2,glGetFBOTexture(fbo1), cutShader, (glitchTime>0||GLITCHS[3]>0)?15:0);

  setFrameBuffer(fbo1, glGetFBOTexture(fbo2), twistShader, (glitchTime+1>0||GLITCHS[4]>0)?1:0);
  // swell free for effects 
  setFrameBuffer(fbo2, glGetFBOTexture(fbo1), swellShader, (GLITCHS[7]>0&&frame%3==0)?0:1);
  setFrameBuffer(fbo1, glGetFBOTexture(fbo2),slitShader, (glitchTime>0||GLITCHS[5]>0)?9:1);
  // glow
  setFrameBuffer(fbo2, glGetFBOTexture(fbo1), glowShader, frame);
  setFrameBuffer(fbo1,glGetFBOTexture(fbo2), crtShader);

 
  // Final draw (the CRT shader is still bound: it is applied again straight to the screen, as in the original)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, c.width, c.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.flush();
}

// PewPlay: glitch countdowns tick once per fixed game step (they used to tick per rendered frame)
function tickGlitches(){
  glitchTime--;
  for (var i = 0; i < GLITCHS.length; i++){GLITCHS[i]--;}
}


// ---- input.js
// PewPlay: unified input (replaces clickEvents.js and keyEvents.js).
// Mouse: aim + left button to fire, right button to warp.
// Keyboard: WASD / arrows to move, Space or Shift to warp, Enter to start.
// Touch: twin-stick — left half moves, right half aims and fires, WARP button.

// mouse states
// 0x, 1y, 2fire, 3warp (logical screen coordinates)
var coords = [0, 0, 0, 0];

var keyMap = 0;
var keys = {
  '65': 1, '37': 1,   // left  (A, arrow)
  '87': 2, '38': 2,   // up    (W, arrow)
  '68': 4, '39': 4,   // right (D, arrow)
  '83': 8, '40': 8    // down  (S, arrow)
};
var moveX = 0, moveY = 0;
var warpKey = false, mouseFire = false, mouseWarp = false, touchWarp = false;
var touchMode = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
var pressedButton = -1;

var sticks = {
  move: { id: null, ox: 0, oy: 0, x: 0, y: 0, base: document.getElementById('stickL') },
  aim: { id: null, ox: 0, oy: 0, x: 0, y: 0, base: document.getElementById('stickR') }
};
var STICK_RADIUS = 56;
var warpEl = document.getElementById('warp');
var muteEl = document.getElementById('mute');

function inGame() {
  return !splashScreen && !gameOver && !bannerEndMessage && fade === 0;
}

function toLogical(clientX, clientY) {
  var r = c.getBoundingClientRect();
  return [(clientX - r.left) * FW / r.width, (clientY - r.top) * FH / r.height];
}

function buttonAt(p) {
  for (var i = 0; i < buttons.length; i++) {
    var b = buttons[i];
    if (b[3] && p[0] >= b[0] && p[0] <= b[0] + b[2] && p[1] >= b[1] - 6 && p[1] <= b[1] + BH + 6) return i;
  }
  return -1;
}

function setTouchMode(value) {
  if (touchMode === value) return;
  touchMode = value;
  refreshTouchUI();
  refreshControlTexts();
}

function refreshTouchUI() {
  var show = touchMode && inGame();
  document.body.classList.toggle('touch-ui', show);
}

function positionTouchUI() {
  var vw = window.innerWidth, vh = window.innerHeight;
  var r = c.getBoundingClientRect();
  var side = r.left, bottom = vh - r.bottom;
  var cx = Math.max(76, side / 2);
  var cy = vh - Math.max(84, bottom / 2);
  sticks.move.hx = cx; sticks.move.hy = cy;
  sticks.aim.hx = vw - cx; sticks.aim.hy = cy;
  var wx, wy;
  if (portrait) { wx = vw - cx - 118; wy = cy; } else { wx = vw - cx; wy = cy - 122; }
  warpEl.style.left = (wx - 34) + 'px';
  warpEl.style.top = (wy - 34) + 'px';
  placeStick(sticks.move);
  placeStick(sticks.aim);
}

function placeStick(s) {
  var active = s.id !== null;
  var bx = active ? s.ox : s.hx, by = active ? s.oy : s.hy;
  s.base.style.transform = 'translate(' + (bx - STICK_RADIUS) + 'px,' + (by - STICK_RADIUS) + 'px)';
  s.base.firstChild.style.transform = 'translate(' + (active ? s.x : 0) + 'px,' + (active ? s.y : 0) + 'px)';
  s.base.classList.toggle('active', active);
}

function stickVector(s) {
  if (s.id === null) return [0, 0, 0];
  var len = Math.sqrt(s.x * s.x + s.y * s.y);
  return [s.x / STICK_RADIUS, s.y / STICK_RADIUS, len / STICK_RADIUS];
}

stage.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  unlockAudio();
  var isTouch = e.pointerType !== 'mouse';
  setTouchMode(isTouch);
  var p = toLogical(e.clientX, e.clientY);
  if (!inGame()) {
    pressedButton = buttonAt(p);
    if (!isTouch) {
      coords[0] = p[0]; coords[1] = p[1];
    }
    return;
  }
  if (!isTouch) {
    if (e.button === 2) mouseWarp = true; else mouseFire = true;
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    return;
  }
  var s = e.clientX < window.innerWidth / 2 ? sticks.move : sticks.aim;
  if (s.id !== null) return;
  s.id = e.pointerId;
  s.ox = e.clientX; s.oy = e.clientY; s.x = 0; s.y = 0;
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  placeStick(s);
});

stage.addEventListener('pointermove', function (e) {
  if (e.pointerType === 'mouse') {
    if (touchMode && (e.movementX || e.movementY)) setTouchMode(false);
    if (inGame()) {
      // chorded buttons (e.g. right click while firing) only report through pointermove
      mouseFire = !!(e.buttons & 1);
      mouseWarp = !!(e.buttons & 2);
    }
    if (GLITCHS[6] > 0 && inGame()) return;
    var p = toLogical(e.clientX, e.clientY);
    coords[0] = p[0]; coords[1] = p[1];
    return;
  }
  var s = e.pointerId === sticks.move.id ? sticks.move : e.pointerId === sticks.aim.id ? sticks.aim : null;
  if (!s) return;
  var dx = e.clientX - s.ox, dy = e.clientY - s.oy;
  var len = Math.sqrt(dx * dx + dy * dy);
  if (len > STICK_RADIUS) {
    // drag the base along so the stick never gets "stuck" at the edge
    var extra = len - STICK_RADIUS;
    s.ox += dx / len * extra; s.oy += dy / len * extra;
    dx = e.clientX - s.ox; dy = e.clientY - s.oy;
  }
  s.x = dx; s.y = dy;
  placeStick(s);
});

function endPointer(e) {
  if (pressedButton >= 0 && !inGame()) {
    var idx = buttonAt(toLogical(e.clientX, e.clientY));
    var b = buttons[pressedButton];
    pressedButton = -1;
    if (idx >= 0 && buttons[idx] === b && b[3]) b[8]();
    return;
  }
  pressedButton = -1;
  if (e.pointerType === 'mouse') {
    mouseFire = false; mouseWarp = false;
    return;
  }
  [sticks.move, sticks.aim].forEach(function (s) {
    if (s.id === e.pointerId) { s.id = null; placeStick(s); }
  });
}
stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);
stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
document.oncontextmenu = function (e) { e.preventDefault(); };

function releaseAll() {
  keyMap = 0; warpKey = false; mouseFire = false; mouseWarp = false; touchWarp = false;
  sticks.move.id = null; sticks.aim.id = null;
  placeStick(sticks.move); placeStick(sticks.aim);
  warpEl.classList.remove('active');
}
window.addEventListener('blur', releaseAll);

warpEl.addEventListener('pointerdown', function (e) {
  e.preventDefault(); e.stopPropagation();
  unlockAudio();
  touchWarp = true;
  warpEl.classList.add('active');
});
function warpUp(e) { e.stopPropagation(); touchWarp = false; warpEl.classList.remove('active'); }
warpEl.addEventListener('pointerup', warpUp);
warpEl.addEventListener('pointercancel', warpUp);
warpEl.addEventListener('pointerleave', warpUp);

function refreshMuteButton() {
  muteEl.classList.toggle('muted', muted);
  muteEl.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  muteEl.title = muted ? 'Unmute (M)' : 'Mute (M)';
}
muteEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
muteEl.addEventListener('click', function (e) {
  e.preventDefault();
  unlockAudio();
  setMuted(!muted);
  refreshMuteButton();
  muteEl.blur();
});
refreshMuteButton();

document.addEventListener('keydown', function (e) {
  var key = e.keyCode || e.which;
  unlockAudio();
  if (keys[key]) {
    keyMap |= keys[key];
    e.preventDefault();
    return;
  }
  if (key === 32 || key === 16 || key === 13) {  // space, shift, enter
    e.preventDefault();
    if (!inGame()) {
      if (!e.repeat && key !== 16) pressDefaultButton();
    } else if (key !== 13) {
      warpKey = true;
    }
    return;
  }
  if (key === 77 && !e.repeat) {  // M
    setMuted(!muted);
    refreshMuteButton();
  }
  if (key === 27 && controlHelp) toggleControls();
});

document.addEventListener('keyup', function (e) {
  var key = e.keyCode || e.which;
  if (keys[key]) {
    keyMap &= ~keys[key];
    e.preventDefault();
  }
  if (key === 32 || key === 16) warpKey = false;
});

function pressDefaultButton() {
  if (fade > 0 || bannerEndMessage) return;
  if (splashScreen) {
    if (controlHelp) toggleControls(); else startGame();
  } else if (gameOver) {
    startGame();
  }
}

// called once per game step, before the update
function applyInput() {
  var kx = ((keyMap & 4) ? 1 : 0) - ((keyMap & 1) ? 1 : 0);
  var ky = ((keyMap & 8) ? 1 : 0) - ((keyMap & 2) ? 1 : 0);
  var mv = stickVector(sticks.move);
  var sx = 0, sy = 0;
  if (mv[2] > 0.18) {
    // map the circle to a square so diagonals are as fast as with the keyboard
    sx = Math.max(-1, Math.min(1, mv[0] * 1.35));
    sy = Math.max(-1, Math.min(1, mv[1] * 1.35));
  }
  moveX = Math.max(-1, Math.min(1, kx + sx));
  moveY = Math.max(-1, Math.min(1, ky + sy));

  var aim = stickVector(sticks.aim);
  var touchFire = false;
  if (sticks.aim.id !== null && aim[2] > 0.3) {
    touchFire = true;
    if (!(GLITCHS[6] > 0)) {
      coords[0] = hero[0] + viewPort[0] + aim[0] / aim[2] * 110;
      coords[1] = hero[1] + viewPort[1] + aim[1] / aim[2] * 110;
    }
  }
  aimingByTouch = touchFire;
  coords[2] = (mouseFire || touchFire) ? 1 : 0;
  coords[3] = (mouseWarp || warpKey || touchWarp) ? 1 : 0;
}
var aimingByTouch = false;


// ---- music.js
// PewPlay: the sequences are created when the audio is unlocked (first user gesture);
// until then they are silent placeholders with the same interface.
function SilentSequence() { this.tempo = 138; }
SilentSequence.prototype.play = function () { return this; };
SilentSequence.prototype.stop = function () { return this; };

var tempo = 138,
  // initialize some vars
  sequence1,
  sequence2,
  sequence3,
  sequence4,
  // create an array of "note strings" that can be passed to a sequence 
  bb1='Bb1 s',
  d2 = 'D2 s',
  ab1 ='Ab1 s',
  g2be = 'G2b e',
  g2e = 'G2 e',
  c2e = 'C2 e',

  lead = [
    bb1,
    d2,
    bb1,
    d2,
    bb1,
    d2,
    bb1,
    d2,
    bb1,
    d2,
    bb1,
    d2,
    bb1,
    d2,
    bb1,
    d2,
    ab1,
    d2,
    ab1,
    d2,
    ab1,
    d2,
    ab1,
    d2,
    ab1,
    d2,
    ab1,
    d2,
    ab1,
    d2,
    ab1,
    d2,
  ],
  harmony = [
    g2e,
    g2be,
    g2e,
    g2be,
    g2e,
    g2be,
    g2e,
    g2be,
    c2e,
    g2be,
    c2e,
    g2be,
    c2e,
    g2be,
    c2e,
    g2be
  ],
  bass2 = [
    '- w',
    'D1 s',
    '- s',
    'D1 e',
    '- q',
    '- m',
    '- w'
  ],
  basebass = [
    'C1 e',
    '- e',
    'A1 e',
    '- e'
  ],
  bass = basebass;

sequence1 = new SilentSequence();
sequence2 = new SilentSequence();
sequence3 = new SilentSequence();
sequence4 = new SilentSequence();

audioReadyListeners.push(function () {
  var ac = audioCtx;
  // create the sequences (lead, harmony, bass, bass 2)
  sequence1 = new Sequence( ac, tempo, lead );
  sequence2 = new Sequence( ac, tempo, harmony );
  sequence3 = new Sequence( ac, tempo, bass );
  sequence4 = new Sequence( ac, tempo, bass2 );

  // set staccato and smoothing values for maximum coolness
  sequence1.staccato = 0.81;
  sequence2.staccato = 0.55;
  sequence3.staccato = 0.05;
  sequence3.smoothing = 0.35;
  sequence4.staccato = 0.05;

  // adjust the levels so the bass and harmony aren't too loud
  sequence1.gain.gain.value = 0.12;
  sequence2.gain.gain.value = 0.09;
  sequence3.gain.gain.value = 0.11;
  sequence4.gain.gain.value = 0.1;
});


// ---- sounds.js
// the frequency is the sixth value index 5

function mutates(sound,mutations){
  var sounds = [];
  for (var i = 0; i < mutations; i++) {
    var newSound = sound.slice();
    newSound[5] = (i-mutations/2)*0.05 + sound[5];
    sounds.push(audio(newSound))
  }
  return sounds;
}

var gameStarts = audio([3,0.2421,0.1876,0.1891,0.2844,0.5008,,-0.0619,0.2484,,0.0432,-0.7113,0.3743,0.007,0.0008,0.0474,-0.0023,0.705,0.7098,0.0034,0.011,0.0259,0.0005,0.42]);
var baseFireSound = [0,,0.12,0.14,0.3,0.8,,-0.3399,0.04,,,-0.04,,0.51,-0.02,,-0.74,,0.21,0.24,,,0.02,0.41];
var fireSounds = mutates(baseFireSound, 6);
var totemAppears = audio([1,,0.38,,0.03,0.03,,0.8799,0.96,0.9411,0.9785,-0.9219,0.82,0.7513,0.6049,0.8,-0.6041,-0.8402,0.28,0.7,0.78,0.1423,-0.7585,0.5]);
var enemyDie = audio([3,0.0597,0.11,0.2,0.2513,0.5277,,0.5841,-0.0248,-0.076,0.5312,-0.2978,0.7065,-0.9091,0.4202,0.966,0.7036,0.4575,1,-0.9064,0.6618,0.0266,-0.0655,0.42]);
var heroSpeedUp = audio([2,,0.09,0.06,0.45,0.27,0.02,-0.28,0.82,0.41,0.58,-0.88,0.07,0.448,-0.355,1,0.54,-0.073,1,,,,,0.42]);
var totemDestroyed = audio([3,0.002,0.6302,0.499,0.0804,0.5224,,-0.0324,0.0004,0.5448,,-0.7762,-0.1765,0.6762,-0.4386,0.7747,-0.0347,-0.2051,0.931,-0.0732,0.4693,0.1444,,0.42]);
var heroDie = audio([1,0.145,0.2094,0.4645,0.4954,0.7134,,-0.1659,-0.8866,0.9733,,-0.572,-0.7927,-0.1186,0.4699,0.6044,0.4604,0.1762,0.9998,0.0236,0.1554,,0.659,0.42]);
var glitchStop = audio([1,0.0076,0.66,,,0.09,,0.96,0.32,0.1,0.97,-1,,0.0615,-0.1587,1,,-0.02,0.83,0.12,0.23,0.0231,-0.02,0.96]);
var baseEnemyHit = [3,0.0691,0.183,0.0949,0.5678,0.46,,-0.0001,,,,-0.542,-0.2106,-0.2402,-0.1594,,-0.3133,-0.0707,0.1592,-0.4479,0.5788,0.0169,-0.919,0.42];
var hitSounds = mutates(baseEnemyHit,8)
var openingGlitch = audio([3,0.0258,0.16,0.0251,0.16,0.05,,-0.86,-0.4088,0.0956,0.256,-0.62,,-0.0006,-0.0352,,-0.0882,-0.0443,0.9219,-0.0531,0.8727,0.031,0.0002,0.6]);
var bossSummon = audio([0,0.95,0.34,0.03,0.05,0.51,,0.96,0.84,0.05,0.51,-0.84,0.99,0.82,,1,,-0.88,0.87,1,0.5,0.21,0.94,0.65]);

// ---- gameState.js
var mapSize,tileset,gameOver,mapPixels,map,slowMotion,viewPort,enemies,hero,heroShape,bullets,particles,message,particleZ,score,glitchStoped,triggers,bigKiller,times,newRecord;
function init(){
  spatialhashing = {},
  mapSize = 21,
  tileset = 40,
  gameOver = false,
  frame=0,
  mapPixels = mapSize*tileset,
  map = [],
  slowMotion = 0.3,
  viewPort = [(FW-mapPixels)/2, (FH-mapPixels)/2], // [x, y] camera offset, see updateCamera()
  // [0x, 1y, 2size, 3angle, 4speed, 5crossFireAngle, 6countDown, 7bulletRatio, 8dashCountDown, 9dashcolddown]
  enemies = [],
  hero = [tileset*10.5, tileset*10.5, 16, 0, 150, 0, 0, 12,0,0],
  heroShape = [[0,1,0,-1],[-1,1,0.5,1]],
  //0x, 1y, 2size, 3angle
  bullets = [],
  // enemy description 
  // 0x, 1y, 2size, 4angleIncrement, 3angle, 5angleMomentum, 6xpath, 7ypath, 8hit
  // 0x, 1y, 2size, 3angle, 4index, 5type, 6hits, 7path, 8path, 9customdata
  // totem description
  // totem spawns enemies 
  // 0x, 1y, 2size, 3angle, 4xpath, 5ypath, 6hitpoints, 7nextInvocation 
  particles = [],
  message = '',
  particleZ = Math.PI/2,
  score = 0,
  glitchTime = 0,
  wave = 1,
  summons = [],
  totemDieShakes = 0,
  alIndex = 0,
  endBannerCounter = 0,
  bannerEndMessage = false,
  bannerCounter = 0,
  //012=rgb, 3, 4, 5, 6stop, 7 nada,
  GLITCHS=[0,0,0,0,0,0,0,0],
  glitchStoped = false,
  triggers = {
    //1st wave 
    500:[1,sequence4],
    2500:[0,10,5,10],
    //2st wave
    8999:[5,'what are you doing?'],
    10500:[1,sequence3],
    10800:[8,2],
    11000:[0,5,5,10],
    18000:[0,15,15,10],
    18001:[5,''],
    25000:[0,15,5,10],
    31000:[0,5,15,10],
    37000:[0,10,11,11],
    37500:[1,sequence1],
    46000:[5,'are you trying to stop us?'],
    // some broken in the matrix 
    48500:[2, 10,0,0,0,10,10,10],
    49000:[2, 10,10,10,15,10,20,10],
    49001:[4, sequence3, 1],
    49002:[4, sequence1, 1],
    49003:[4, sequence4, 1],
    49500:[8,3],
    50004:[2, 60,60,68,55,50,45,60],
    51000:[4, sequence3, 138],
    51001:[4, sequence1, 138],
    51002:[4, sequence4, 138],
    51003:[5,'we are perfection'],
    //3st wave
    52000:[0,4,10,11],
    53000:[0,14,10,10],
    55550:[5,''],
    61000:[0,10,16,11],
    61003:[5,'we are creation'],
    66550:[5,''],
    67000:[0,16,10,11],
    68000:[0,6,10,10],
    72000:[0,10,4,11],
    // some cool effect for the summon in the middle
    80501:[2, 1000,0,0,0,0,0,10],
    83000:[0,10,9,12],
    83500:[1,sequence2],
    95050:[5,'you must stop this'],
    99950:[5,'it\'s inevitable!'],
    99980:[8,4],
   100000:[0,10, 1,12],
   103050:[5,''],
   106000:[0,1, 10,12],
   111000:[0,19, 10,12],
   116000:[0,10, 19,12],
    // some cool effect
   140000:[8,5],
   140001:[5,'can\'t you understand?'],
    //5st wave
   141600:[0,10,12,10],
   141601:[0,12,13,10],
   141602:[0,12,15,10],
   141603:[0,10,16,10],
   141604:[0,8,15,10],
   141605:[0,8,13,10],
   145050:[5,''],
   156800:[6,'stop'],
   156900:[6,'now'],
   157000:[0,10,14,13],//3 
   180000:[6,'you'],
   180100:[6,'are'],
   180200:[6,'the'],
   180300:[6,'glitch'],
   181000:[8,6],
   //6th wave 
   182000:[7,sequence1],
   182050:[7,sequence2],
   182100:[7,sequence3],
   182150:[7,sequence4],
   185100:[2,300,0,300,0,0,0,0],
   // mega special summon
   187000:[0,10,10,14],
   189000:[1,sequence1],
   189001:[1,sequence2],
   189002:[1,sequence3],
   189003:[1,sequence4],
   //god mode 
   300100:[1,sequence4],
   305000:[0,10,5,10],
   308000:[1,sequence3],
   310000:[0,10,6,11],
   311000:[1,sequence4],
   315000:[0,14,6,10],
   317000:[0,14,14,10],
   319000:[0,6,14,10],
   320000:[0,6,6,10],
   335000:[0,11,11,12],
   336000:[0,9,11,12],
   337000:[0,11,9,12],
   338000:[0,9,9,12],
   350000:[0,19,19,11],
   352000:[0,1,19,11],
   354000:[0,1,1,11],
   355000:[0,19,1,11],
   365000:[0,10,8,10],
   366000:[0,11,9,10],
   367000:[0,12,10,10],
   368000:[0,11,11,10],
   369000:[0,10,12,10],
   370000:[0,9,11,10],
   371000:[0,8,10,10],
   372000:[0,9,9,10],
   395000:[0,1,1,12],
   395001:[0,1,19,12],
   395002:[0,19,19,12],
   395003:[0,20,1,12],
   395004:[0,10,10,12],
   425000:[0,0,10,13],
   425001:[0,20,10,13],
   570001:[0,10,10,13]
  },
  bigKiller = undefined;  // reference for enemy followers

  for(var i=0;i<mapSize;i++){
    map.push([]);
    for(var j=0;j<mapSize;j++){
      map[i].push([]);
    }
  }
  for(var i=0;i<mapSize-1;i++){
    if(i==10) continue;
    triggers[450000+i*6000]=[0,i,i,10];
    triggers[453000+i*6000]=[0,mapSize-i-1,i,10];
  }
  times=Object.keys(triggers).map(function(element){return parseInt(element)});
  //map[5][5]=1; 

  // enemy type movement, 
  /*types
  0-5 enemies that moves
  enemy[9][angleIncrement, angleMomentun]
  >5 totems 
  */
  sequence1.stop();
  sequence2.stop();
  sequence3.stop();
  sequence4.stop();
  record = parseFloat(storage.getItem('record')||0);
  for (var i = 0; buttons&&i < buttons.length; i++) {
    buttons[i][3] = false;
  }
  newRecord = false;
  randomGlitch();
  loadGod();
}

function loadGod(){
  if(godMode){
    heroShape=[[0,-0.5,-0.25,-1,-0.5,-0.4,-0.5,-0.25,0,0.25,0.5,0.4,0.5,1,0.25,0.5,],[-0.25,0,-1,0.25,0.75,0.5,0.25,0.2,0.8,0.2,0.25,0.5,0.75,0.25,-1,0]];
    hero[4]=160;
    hero[2]=20;
    hero[7]=22;
  }
  if(startFromGodMode){
    score = 300000;
    wave = 7;
    for (var i = times.length-1; i>=0; i--) {
      if(times[i]<300000){
        times.splice(i,1);
      }
    }
  }
}


// ---- splash.js
var splashScreen = true;
var animationLine = 0;
var distanceLine = 30;
var controlHelp = false;
var fade = 0;
function drawDiagonal(x, y, width, vertical, offset){
  ctx.moveTo(x,y);
  ctx.lineTo(x+(vertical?offset:width),y+(vertical?width:offset));
}
function drawLine(x,y,width, vertical){
  drawDiagonal(x,y,width,vertical,0);
}
function crossLine(x,y,width){
  drawLine(x,y,width,true);
  drawLine(y,x,width);
}


function drawSplash(){
  ctx.save();
  ctx.beginPath();
  setContextAtrribute(23,1);
  ctx.fillRect(0,0,FW, FH);

  setContextAtrribute(0);
  //
  var halfHeight = FH/2;
  var horizon = distanceLine*2;
  ctx.beginPath();
  for (var i = 0; i < halfHeight/distanceLine; i++){
    var dis = easeInQuad(i*distanceLine+animationLine, halfHeight+horizon, halfHeight, halfHeight);
    setContextAtrribute(1);
    drawLine(0,dis+0.5,FW);
  }
  ctx.stroke(); 
  ctx.beginPath();
  for (var i = 0; i < halfHeight/distanceLine; i++){
    var dis = easeInQuad(i*distanceLine+animationLine, halfHeight+horizon, halfHeight, halfHeight);
    setContextAtrribute(2);
    drawLine(0,FH-dis-0.5,FW);
  }
  ctx.stroke(); 
  var limit = halfHeight-horizon;
  setContextAtrribute(2);
  ctx.beginPath();
  drawLine(0,limit,FW)
  drawLine(FW/2,limit,-limit, true);
  ctx.stroke(); 

  setContextAtrribute(1);
  ctx.beginPath();
  drawLine(0,FH-limit,FW)
  drawLine(FW/2,FH-limit, limit, true);
  ctx.stroke(); 
  ctx.beginPath();
  for (var i = 1; i < FW/(distanceLine*2); i++) {
    var offset = i*i*5+25;
    setContextAtrribute(2);
    drawDiagonal(i*distanceLine+FW/2,limit,-limit,true,offset);
    drawDiagonal(-i*distanceLine+FW/2,limit,-limit,true,-offset);
  }
  ctx.stroke(); 
  ctx.beginPath();
  for (var i = 1; i < FW/(distanceLine*2); i++) {
    var offset = i*i*5+25;
    setContextAtrribute(1);
    drawDiagonal(i*distanceLine+FW/2,FH-limit,limit,true,offset);
    drawDiagonal(-i*distanceLine+FW/2,FH-limit,limit,true,-offset);
  }
  ctx.stroke(); 

  var cx = FW/2, cy = FH/2;
  if(controlHelp){
    displayWord('controls', cx, cy-200,12, [0,16]);
    var lines = touchMode ?
      ['move        left thumb', 'aim/fire   right thumb', 'warp time  warp button'] :
      ['move   wasd or arrows', 'aim             mouse', 'fire       left click', 'warp time right click'];
    for (var li = 0; li < lines.length; li++) {
      displayWord(lines[li], cx, cy-130+li*42, 12, [0,0]);
    }
    if (!touchMode) displayWord('space or shift also warps', cx, cy+40, 9, [0,17]);
  }else{
    displayWord('winners don\'t use drugs', cx+1, portrait ? 60 : 50,9, [0,0]);
    // logo: same neon 14-segment style as the original, new name
    var zoom = 1+fade;
    if (portrait) {
      displayWord('glitch', cx, cy-190-fade*50, 38*zoom, [0,9,0,9]);
      displayWord('hunter', cx, cy-80+fade*50, 38*zoom, [0,9,0,9]);
    } else {
      displayWord('glitch hunter', cx, splashLogoY-fade*50,28*zoom, [0,9,0,9]);
    }
  }

  displayWord('made by agar3s', cx+1, FH-(portrait?112:92),9, [0,10]);
  displayWord('art direction lorena marquez', cx+1, FH-(portrait?80:60),portrait?7:8, [0,17]);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function updateSplash(){
  animationLine++;
  if(animationLine>distanceLine){
    animationLine=0;
  }
}

function startGame(){
  if(fade>0) return;
  fade=0.01;
}

function startGodMode(){
  startFromGodMode = true;
  godMode = true;
  startGame();
}
init();


// ---- banner.js
var bannerScreen = false;
var bannerMessage='';
function launchBanner(message,length){
  GLITCHS[6]=30;
  bannerCounter=length||30;
  glitchTime = 10;
  bannerMessage = message;
}

function drawBanner(){
  var widthSequence = [20,20,20,20,20,20,20,20,20,20,20,20];
  ctx.save();
  ctx.beginPath();
  setContextAtrribute(2,1);
  ctx.fillRect(0,0,FW, FH);
  var size = fitWordSize(bannerMessage, bannerMessage.length<5?120:70, FW-60);
  displayWord(bannerMessage, FW/2+30,FH/2-size,size,widthSequence);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

var endMessages = [
'',
'now i see',
'i am creation',
'you are destruction',
'we are going to be',
'in this battle',
'forever'];


function updateEnds(){
  switch(endBannerCounter){
    case 90:
      launchBanner('what',30);
    break;
    case 120:
      launchBanner('have',30);
    break;
    case 150:
      launchBanner('you',30);
    break;
    case 180:
      launchBanner('done?',120);
    break;
    case 185:
      GLITCHS=[100,100,100,0,0,0,0];
    break
    case 215:
      GLITCHS=[100,100,100,100,100,100,100];
      sequence1.stop();
      sequence2.stop();
      sequence2.tempo=1;
      sequence2.play();
      sequence3.stop();
      sequence3.tempo=1;
      sequence3.play();
      sequence4.stop();
    break;
    case 320:
      sequence2.stop();
      sequence3.stop();
      sequence2.tempo=138;
      sequence3.tempo=138;
      bannerMessage='';
    break;
    case 434:
      totemDieShakes=0;
    break;
  }
  if(endBannerCounter>435&&endBannerCounter<1694){
    bannerMessage=endMessages[~~((endBannerCounter-435)/180)];
  }
  if(endBannerCounter>1694){
    bannerEndMessage= false;
    score=300000;
    wave=7;
    enemies = [];
    bullets=[];
    godMode = true;
    storage.setItem('hunter-mode', '1');
    godModeAvailable = true;
    loadGod();
  }
  endBannerCounter++;
}
function drawBannerEnds(){
  if(endBannerCounter<300)return;
  var widthSequence = [0,0,0,0];
  ctx.save();
  ctx.beginPath();
  if(endBannerCounter<436){
    setContextAtrribute(-1,1,'rgba(0,0,0,'+(1-(436-endBannerCounter)/120)+')');
    ctx.fillRect(0,0,FW,FH);
    
  }else{
    setContextAtrribute(23,1);
    ctx.fillRect(0,0,FW,FH);
    displayWord(bannerMessage,FW/2,FH/2-50,fitWordSize(bannerMessage,16,FW-40),widthSequence);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}


// ---- controllers.js
function checkRecord(){
  newRecord = score>record;
  if(!newRecord) return;
  record = score;
  storage.setItem('record', score.toFixed(0));
}

function getRandomValue(value, offset){
  return Math.random()*(value||1) + (offset||0);
}
function randomSign(){
  return getRandomValue()>0.5?1:-1;
}
function randomGlitch(){
  var tempDuration = getRandomValue(10,5);
  GLITCHS=[tempDuration,tempDuration,tempDuration,getRandomValue(10,5),getRandomValue(10,5),getRandomValue(10,5),0];
}

function toggleControls(){
  play(heroSpeedUp);
  controlHelp = !controlHelp;
  buttons[1][3] = !controlHelp;
  buttons[3][3] = !controlHelp&&godModeAvailable;
  buttons[2][5] = controlHelp?'go back':'controls';
  layoutButtons();
}


// ---- buttons.js
// x, y, width, visible, color, message, clicked, hover, action
// (PewPlay: share buttons removed, positions computed by layoutButtons() for any screen shape)
var BH = 42; // button height in logical pixels (taller on small screens so it stays >= 44 css px)
var splashLogoY = 240; // y of the logo on the title screen
var buttons = [[0, 0, 300, false, 10, 'start again', false, false, startGame],
               [0, 0, 320, true, 13, 'click to start', false, false, startGame],
               [0, 0, 280, true, 13, 'controls', false, false, toggleControls],
               [0, 0, 280, godModeAvailable, 16, 'evil mode', false, false, startGodMode]];

function layoutButtons(){
  BH = Math.max(42, Math.ceil(46 / displayScale));
  var gap = BH + 20;
  var cx = FW / 2;
  var compact = !portrait && BH > 50; // short landscape screens (phones): big buttons, tighter layout
  var base = portrait ? FH / 2 + 110 : compact ? FH / 2 - 10 : FH / 2 + 80;
  splashLogoY = compact ? FH / 2 - 110 : FH / 2 - 60;
  buttons[0][1] = FH / 2 + 20;
  buttons[1][1] = base;
  buttons[2][1] = base + gap;
  buttons[3][1] = portrait ? FH / 2 - 300 : FH / 2 - 185;
  var size = BH > 54 ? 16 : 12;
  for (var i = 0; i < buttons.length; i++) {
    buttons[i][2] = Math.max(i == 1 ? 320 : 280, buttons[i][5].length * (size + 10) + 40);
    buttons[i][0] = cx - buttons[i][2] / 2;
  }
  if (compact && buttons[3][3]) {
    // no room above the logo: "controls" and "evil mode" share the second row
    buttons[3][1] = buttons[2][1];
    buttons[2][0] = cx - 10 - buttons[2][2];
    buttons[3][0] = cx + 10;
  }
}
layoutListeners.push(layoutButtons);

function refreshControlTexts(){
  buttons[1][5] = touchMode ? 'tap to start' : 'click to start';
  layoutButtons();
}

function drawButtons(){
  // absolute position
  var size = BH > 54 ? 16 : 12;
  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    if(!button[3]) continue;
    var colorIndex = button[7]?14:button[4];
    setContextAtrribute(colorIndex);
    setContextAtrribute(-1,2,2);
    ctx.strokeRect(button[0], button[1],button[2],BH);
    displayWord(button[5], button[0]+button[2]/2, button[1]+(BH-2*size)/2,size, [0,colorIndex]);
  }
}

// hover highlight for the mouse (clicks and taps are handled in input.js)
function updateButtons(){
  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    button[7] = !touchMode && button[3] && coords[0]>=button[0] && coords[0]<=button[0]+button[2] && coords[1]>=button[1] && coords[1]<=button[1]+BH;
  }
}


// ---- handleTrigger.js
// x, y, timeleft, baseTime, summonElement, baseanimation...
var summons = [];

function updateSummons(){
  for (var i = 0; i < summons.length; i++) {
    var summon = summons[i];
    summon[2]-=dt;
    if(summon[2]<0){
      enemies.push(createEnemy(summon[4]));
      if(summon[4][2]>9){
        glitchTime = 10;
        play(totemAppears);
      }
      if(summon[4][2]==3){
        bigKiller = enemies[enemies.length-1];
      }
      summons.splice(i, 1);
    }
  }
}

function drawSummonBoss(x,y,percentage, size){
  ctx.translate(x,y);
  ctx.beginPath();
  setContextAtrribute(-1,1,'rgba(210,0,0,0.9)')
  ctx.arc(0,0,mapPixels*(1-percentage),0, Math.PI*2);
  ctx.stroke();
  ctx.fill();
  ctx.beginPath();
  setContextAtrribute(0);
  if(percentage<0.3){
    ctx.moveTo(-size*percentage/0.3,0);
    ctx.lineTo(size*percentage/0.3,0);
  }else{
    setContextAtrribute(0,1);
    ctx.bezierCurveTo(-size, 0, 0, -size*percentage/3.5, size, 0);
    ctx.bezierCurveTo(size, 0, 0, size*percentage/3.5, -size, 0);
    ctx.fill();
  }
  ctx.closePath();
  ctx.translate(-x,-y);
}

function drawSummons(){
  ctx.beginPath();
  for (var i = 0; i < summons.length; i++) {
    var summon=summons[i];
    var enemyType = summon[4][2];
    var size = necronomicon[enemyType][0];
    var percentage = easeOutQuad(summon[2],1,-1, summon[3]);
    var x = summon[0]+viewPort[0]+shakeScreen[0];
    var y = summon[1]+viewPort[1]+shakeScreen[1];
    if(enemyType==14){
      drawSummonBoss(x, y,percentage, size);
      continue
    }
    setContextAtrribute(-1,0,'rgba(38,82,255,'+percentage+')');
    ctx.fillRect(x-percentage*size, y-percentage*size, percentage*size*2, percentage*size*2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function scheduleSummon(x,y,time, element){
  if(element[2]==14){
    time *=2;
    play(bossSummon);
  }
  summons.push([x, y, time, time, element])
}

var alSequence=[10,10,11,11,11,12,12,10,10,11,13,10,11,12,12];
var alIndex =0;

function updateTrigger(){
  if(times.length>0&&score>times[0]){
    var trigger  = triggers[times.splice(0,1)[0]];
    var type = trigger.splice(0,1)[0];
    switch(type){
      case 0:
        trigger[0]=(trigger[0]+0.5)*tileset;
        trigger[1]=(trigger[1]+0.5)*tileset;
        scheduleSummon(trigger[0], trigger[1], 1, trigger);
      break;
      case 1:
        trigger[0].play();
      break;
      case 2:
        GLITCHS = trigger;
      break;
      case 3:
        play(trigger[0])
      break;
      case 4:
        trigger[0].tempo = trigger[1];
        if(trigger[1]==138){trigger[0].stop();trigger[0].play()}
      break;
      case 5:
        message = trigger[0];
      break;
      case 6:
        launchBanner(trigger[0]);
      break;
      case 7:
        trigger[0].stop()
      break;
      case 8:
        wave = trigger[0]
      break;
    }

  }else if(times.length==0){  // to infinite mode 
    if(alIndex++>=alSequence.length){
      alIndex=0;
    }
    triggers[score+5000] = [0,~~(getRandomValue(21)),~~(getRandomValue(21)),alSequence[alIndex]]
    times.push(score+5000)
  }
}

// ---- corruption.js
//corrupt algorithm 
function corruptZone(x, y, radius){
  var col = ~~(x/tileset);
  var row = ~~(y/tileset);
  var r = Math.ceil(radius/tileset);
  for(var j = row-r; j < row+r; j++){
    if(typeof(map[j])=='undefined') continue;
    for(var i = col-r; i < col+r; i++){
      if(map[j][i]==1||getHypo((j+0.5)*tileset-y, (i+0.5)*tileset-x)>=radius) continue;
      map[j][i]=1;
    }
  }
}

function removeCorruption(x, y, radius){
 var col = ~~(x/tileset);
  var row = ~~(y/tileset);
  var r = Math.ceil(radius/tileset);
  for(var j = row-r; j < row+r; j++){
    if(typeof(map[j])=='undefined') continue;
    for(var i = col-r; i < col+r; i++){
      if(map[j][i]==1||getHypo((j+0.5)*tileset-y, (i+0.5)*tileset-x)<=radius){
        map[j][i]=0;
      }
    }
  } 
}

// ---- enemies.js
var necronomicon = [
// normal enemies 
//size, angle, summonTime, type, hits, xpoints, ypoints, customData:angleTarget, customData: angleMomentum, anglediff, speed
// 0: basic square
[15,    0,     0,          0,    1, [1,0.25,-1,0.25],[0,-0.75,0,0.75],                 0, 3,0.1,1.1],
// 1: simple killer
[15,    0,     0,          1,    4, [1,0.3,0,-2,0,0.3], [0,1,0.3,0,-0.3,-1], 0, 3,0.05,0.8],
// 2: follower 
[8,    0,     0,           2,    2, [1,0.25,-1,0.25],[0,-0.5,0,0.5],0, 3.5,0.15,1.6],
// 3: heavy killer
[20,    0,     0,          3,    9, [0,0.25,0.75,0.75,1,0.75,0.75,0.25,0,-0.25,-0.75,-0.75,-1,-0.75,-0.75,-0.25], [-1,-0.75,-0.75,-0.25,0,0.25,0.75,0.75,1,0.75,0.75,0.25,0,-0.25,-0.75,-0.75], 0, 1,0.12,1.05],
//4: guardian
[12,    0,     0,          4,    5, [0,0.25,1,0.25,0,-0.25,-1,-0.25], [-1,-0.25,0,0.25,1,0.25,0,-0.25],                 0, 3,0.03,2.5, 0,0,0], // last two parameters, x y to turnon radiis
//5: bullet basic triangle
[3,    0,     0,           5,    150, [1,-1,-1], [0,1,-1],0, 0,0,1.4], // last two parameters, x y to turnon radiis
//6: totem seed - countdown=13 
[16,   0,     0,           6,    9, [1,0.25,-1,0.25],[0,-0.75,0,0.75], 0,0,0,0.6,3.5],
//7: totem seed - countdown=13 
[18,   0,     0,           7,    8, [1,0.25,-1,0.25],[0,0.75,0,-0.75], 0,0,0,0.8,2.5],
//8: nothing decided
[20,   0,     0,           8,   7, [1,0.25,-1,0.25],[0,0.75,0,-0.75], 0,0,0,1.2,1.5],
//9: nothing decided 
,
// spawners 10 -- por si acaso
//size, angle, hitEffect, type, hits, xpoints, ypoints, customData:nextInvocation, corruptionPower, corruptionRatio
//pyramid solid
[tileset/2, 0, 0, 10, 9, [[-1,0,0],[0,0,1],[-1,1,0]], [[-1.5,-0.5,0.5],[-0.5,0.5,-1.5],[-1.5,-1.5,-0.5]], 100, 0,7],
//cube solid 
[tileset/2, 0, 0, 11, 10, [[-1,0,0,-1],[1,0,0,1],[-1,0,1,0],[-1,0,1,0],[-1,0,0,-1],[1,0,0,1]], [[-1.25,-0.5,0.8,0.25],[-1.25,-0.5,0.8,0.25],[-1.25,-0.5,-1.25,-1.8],[0.25,-0.5,0.25,0.8],[0.25,-0.5,-1.8,-1.25],[0.25,-0.5,-1.8,-1.25]], 100, 0,6],
//prism solid 
[tileset*0.8, 0, 0, 12, 15, [[-0.5,0,0.5,0],[-0.5,0,0],[0.5,0,0],[-0.5,0,0],[0.5,0,0]], [[-0.75,-1,-0.75,-0.5],[-0.75,-0.5,0.25],[-0.75,-0.5,0.25],[-0.75,-1.75,-0.5],[-0.75,-1.75,-0.5]], 0.9, 0,4,0.004],
// st
[tileset*1.2, 0, 0, 13, 50, [[0,-0.75,0],[0,0.75,0],[-0.75,0.75,0],[-0.75,0.75,0],[-0.35,0.35,0]], [[-1,0.5,0],[-1,0.5,0],[0.5,0.5,0],[-0.5,-0.5,1],[0.25,0.25,-0.5]], 0.9, 0,13,0.1],
// flower of fucking life - summon counter=13 
[tileset*2.5, 0, 0, 14, 200, [], [], 0.9, 0,60,0.003, 1,0,[6,7,6,7,8]]
];

var invocationTimes={
  10: 2800,
  11: 2600,
  12: 60,
  13:200
}

var totemDieShakes = 0;

function summonGuardian(enemy, j){
  var newEnemy = createEnemy([enemy[0]+Math.cos(Math.PI*j/3)*10,enemy[1]+Math.sin(Math.PI*j/3)*10, 4])
  newEnemy[13] = enemy;
  newEnemy[9] = getAngle(newEnemy, enemy); 
  newEnemy[3] = newEnemy[9]+enemy[11];
  newEnemy[15]=0;
  newEnemy[16]=0;
  enemies.push(newEnemy);
}

// values: x, y, type
function createEnemy(values){
  var enemy = values.slice(0,2).concat(necronomicon[values[2]].slice(0));

  if(enemy[5]==12||enemy[5]==14){
    for (var j = 0; j<6; j++) {
      summonGuardian(enemy, j);
    }
  }
// for (var j = 0; j<12; j++) { for the last enemy 
// var newEnemy = createEnemy([enemy[0]+Math.cos(Math.PI*2*j/12+0.1)*10,enemy[1]+Math.sin(Math.PI*2*j/12+0.1)*10, 4])
  return enemy;
}

//draw methods 

function drawFace(xPath, yPath, size, index, color){
  ctx.beginPath();
  var value = 125-index*20;
  setContextAtrribute(-1,1,'rgba('+color+')');
  path(xPath, yPath,size)
  ctx.closePath();
  ctx.fill()
  ctx.stroke()
}

function pathEnemy(enemy){
  ctx.rotate(enemy[9])
  path(enemy[7], enemy[8], enemy[2])
  //ctx.strokeRect(enemy[7][0], enemy[8][1], enemy[2]*2, enemy[2]*2)  
  ctx.rotate(-enemy[9])
}
var flowerOfpoints = [];
for (var i = 0; i < 6; i++) {
  var angle = (i-3)*Math.PI/3+Math.PI/6;
  var x = Math.cos(angle);
  var y = Math.sin(angle);
  flowerOfpoints.push(x,y);
}
function drawFlowerOfLife(enemy){
  var color = 'hsla('+enemy[3]*20+',50%,60%, 0.5)';
  setContextAtrribute(-1,2,2);
  ctx.beginPath();
  setContextAtrribute(-1,0,enemy[4]>0?colors[3]:color);
  var relativeSize = enemy[2]/3.5;
  ctx.arc(0,0, relativeSize/2, 0, Math.PI*2, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.bezierCurveTo(-relativeSize, 0, 0, -relativeSize, relativeSize, 0);
  ctx.bezierCurveTo(relativeSize, 0, 0, relativeSize, -relativeSize, 0);
  ctx.stroke(); 
  ctx.rotate(enemy[3]);
  for (var i = 0; i < 6; i++) {
    var x= flowerOfpoints[i*2];
    var y= flowerOfpoints[i*2+1]
    var angle = (i-3)*Math.PI/3;
    ctx.beginPath(); 
    ctx.arc(4*x*relativeSize,4*y*relativeSize, relativeSize, 0, Math.PI*2, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(2*x*relativeSize,2*y*relativeSize, relativeSize, 0, Math.PI*2, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x*relativeSize*4,y*relativeSize*4);
    ctx.lineTo(relativeSize*4*flowerOfpoints[(i*2+2)%12],relativeSize*4*flowerOfpoints[(i*2+3)%12]);
    ctx.lineTo(relativeSize*4*flowerOfpoints[(i*2+6)%12],relativeSize*4*flowerOfpoints[(i*2+7)%12]);
    ctx.moveTo(x*relativeSize*2,y*relativeSize*2);
    ctx.lineTo(relativeSize*2*flowerOfpoints[(i*2+2)%12],relativeSize*2*flowerOfpoints[(i*2+3)%12]);
    ctx.lineTo(relativeSize*2*flowerOfpoints[(i*2+6)%12],relativeSize*2*flowerOfpoints[(i*2+7)%12]);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.rotate(-enemy[3]);

}

// greater the percentage blink fast
function blink(percentage, i){
  if(percentage>0.99) return 1;
  var value = percentage*100;
  var umbral = 1/(percentage);
  return value%(umbral)>(umbral/2)?1:0;
}
var blinkValues={};
for (var i = 0; i < 10000; i++) {
  blinkValues[(i/10000).toFixed(4)] = blink(i/10000, i)
}

function pathTotem(totem){
  var loading = (invocationTimes[totem[5]]-totem[9])/invocationTimes[totem[5]];
  var green = totem[4]>0?-55:~~(200*loading)*blinkValues[loading.toFixed(4)];
  //setContextAtrribute(totem[4]>0?15:green==0?16:17)
  setContextAtrribute(16)
  for(var i = 0; i < totem[7].length; i++){
    drawFace(totem[7][i], totem[8][i], totem[2], i, [80+totem[4],55+green,130+~~(green/2),totem[4]>0?0.9:0.2]);
  }
}

function drawEnemy(enemy){
  if(enemy[0]+viewPort[0]<20||enemy[0]+viewPort[0]>W-20||enemy[1]+viewPort[1]<20||enemy[1]+viewPort[1]>H-20) return;
  var offsetX = enemy[0]+viewPort[0]+shakeScreen[0]+randomSign()*enemy[4]/40; // 20 /2 width/2
  var value = (enemy[5]>9?Math.sin((frame/50)%(Math.PI*2))*5+5:0);
  var offsetY = enemy[1]+viewPort[1]+shakeScreen[1]+randomSign()*enemy[4]/40-value;
  ctx.translate(offsetX, offsetY);
  ctx.beginPath();
  if(enemy[5]<10){
    setContextAtrribute(enemy[5]+24);//temporal
    //setContextAtrribute(-1,0,'hsla('+enemy[5]*36+',50%,60%,0.8)');
    setContextAtrribute(-1,2,2);
    pathEnemy(enemy);
  }else if(enemy[5]==14){
    drawFlowerOfLife(enemy,1);
  }else {
    setContextAtrribute(-1,2,2);
    pathTotem(enemy);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.translate(-offsetX, -offsetY)
}

var spawns = {
  10: function(enemy){
    for (var j = 0; j<9; j++) {
      if(j==4) continue;  //summon especial
      var x = enemy[0]+(j%3-1)*tileset;
      var y = enemy[1]+(~~(j/3)-1)*tileset;
      scheduleSummon(x,y,0.65,[x,y,j==1?1:0]);
      //var newEnemy = createEnemy([enemy[0]+(j%3-1)*tileset,enemy[1]+(~~(j/3)-1)*tileset, j==1?1:0])
      //enemies.push(newEnemy);
    }
    enemy[9]=invocationTimes[10];  // time to summon again 
  },
  11: function(enemy){
    for (var j = 0; j<12; j++) {
      if(j==4) continue;  //summon especial
      var x = enemy[0]+(j%3-1)*tileset;
      var y = enemy[1]+(~~(j/3)-1)*tileset;
      scheduleSummon(x,y,0.65,[x,y,j==1?3:2])

      //if(j==1) bigKiller = newEnemy;
      //enemies.push(newEnemy);
    }
    enemy[9]=invocationTimes[11];
  },
  12: function(enemy){ // 
    for (var i = 0; i < 2; i++) {
      var newEnemy = createEnemy([enemy[0],enemy[1], 5])
      newEnemy[9] = enemy[3]+i*Math.PI;
      enemies.push(newEnemy);
    } 
    enemy[9]=invocationTimes[12]; //crazy  0.3
  },
  13: function(enemy){
    for (var i = 0; i < 6; i++) {
      var newEnemy = createEnemy([enemy[0],enemy[1], 5])
      newEnemy[9] = enemy[3]+(i-3)*Math.PI/3;
      newEnemy[12]+=0.5;
      enemies.push(newEnemy);
    }
    enemy[9]=45;
  },
  14:function(enemy){
    for (var i = 0; i < 6; i++) {
      var newEnemy = createEnemy([enemy[0],enemy[1], 5])
      newEnemy[9] = enemy[3]+(i-3)*Math.PI/3+Math.PI/6;
      newEnemy[12]-=0.6;
      enemies.push(newEnemy);
    } 
    if(enemy[13]%16==0){
      var newEnemy = createEnemy([enemy[0],enemy[1], enemy[15][enemy[14]%enemy[15].length]]);
      newEnemy[9] = enemy[3]/2;
      enemies.push(newEnemy);
      enemy[14]++;
    }
    if(enemy[13]%100==0){
      for (var j = 0; j<6; j++) {
        summonGuardian(enemy, j);
      }
    }
    enemy[9]=70; 
    enemy[13]++;
  }
}

// update methods   
function updateEnemy(enemy,index){
  // have zero life
  if(enemy[6]<=0){
    enemies.splice(index,1);
    if(enemy[5]==5) return;
    if(enemy[5]==14){
      bannerEndMessage = true;
    }
    createParticles(enemy[0], enemy[1], enemy[2], necronomicon[enemy[5]][0],necronomicon[enemy[5]][0]*2,enemy[5]+24);
    if(enemy[5]>9){
      removeCorruption(enemy[0], enemy[1], enemy[10]);
      totemDieShakes=4;
      play(totemDestroyed);
    }else{
      play(enemyDie);
    }
    return;
  }

  if(enemy[4]>0){
    enemy[4]-=50;
  }
  // miniom
  if(enemy[5]<10){
    if(enemy[10]*(enemy[9]-enemy[3])>0){
      if(enemy[5]==2){//follower 
        enemy[3] = getAngle(enemy, bigKiller||[0,0]);
      }else if(enemy[5]==4){
        enemy[3]+=enemy[9]+enemy[11];
      }else{
        enemy[3] = getAngle(enemy, hero);
      }
      enemy[10] = enemy[3]>enemy[9]?enemy[11]:-enemy[11];
    }

    var otherEnemy = collideElements(enemy);
    if(enemy[5]==4){
      enemy[9] +=enemy[10]*t;
    }else if(enemy[5]!=3||(otherEnemy&&otherEnemy[5]==3)){  //type 3 dont collide with followers and collide with himself
      enemy[9] +=(otherEnemy?-1:1)*enemy[10];
    }else{
      enemy[9] +=enemy[10];
    }
    
    if(enemy[5]==5){
      enemy[6]-=t/10;
    }

    if(enemy[5]>5&&enemy[5]<10){
      enemy[13]-=dt;
      if(enemy[13]<0){ 
        var coords = [(~~(enemy[0]/tileset)+0.5)*tileset, (~~(enemy[1]/tileset)+0.5)*tileset,enemy[5]+4];
        scheduleSummon(coords[0], coords[1], 1, coords);
        enemies.splice(index,1);
        return;
      }
    }

    if(enemy[5]!=4){
      enemy[0] += Math.cos(enemy[9])*t*enemy[12];
      enemy[1] += Math.sin(enemy[9])*t*enemy[12];
    }else{
      // guardians moves
      if(enemy[13][6]<1){
        enemy[10]*=0.99;
      }
      enemy[15] = tileset*2*(-Math.cos(enemy[16])+1.2);
      enemy[16]+=t/200;
      enemy[0] = enemy[13][0]+Math.cos(enemy[9])*enemy[15];
      enemy[1] = enemy[13][1]+Math.sin(enemy[9])*enemy[15];
    }

  // spawner
  }else{
    enemy[9]-=t;
    if(enemy[5]>=12)enemy[3]+=enemy[12]*t;
    if(enemy[9]<0&&!gameOver){
      spawns[enemy[5]](enemy);
    }
    enemy[10]+=dt*enemy[11];
    corruptZone(enemy[0], enemy[1], enemy[10]);
  }
  addItem(enemy);
}


// ---- gameLoop.js
/**
* read the last events in game, update world
*/

function die(killer){
  play(heroDie);
  createParticles(hero[0], hero[1], hero[2], 10, 80,6);
  heroShape=[[], []]
  gameOver = true;
  sequence1.stop();
  sequence2.stop();
  sequence3.stop();
  sequence4.stop();
  buttons[0][3] = true;
  t = dt*30;
  checkRecord();
  frame=0;
}

function drawPointer(){
  if(touchMode && !(aimingByTouch && inGame())) return;
  ctx.save();
  ctx.beginPath();
  setContextAtrribute(-1,2,2);
  ctx.translate(coords[0], coords[1]);
  setContextAtrribute(6);
  ctx.translate(-10, -10);
  crossLine(10,0,20);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

function playerUdate(dt){
  
  // apply speed to hero movement
  t = dt*hero[4]*(hero[8]>0?slowMotion:1);
  // move depending on keys pressed / left stick (PewPlay: analog, same speed as the keyboard)
  var speed = dt*hero[4]*(hero[8]>0?1.4:1);
  if(map[Math.round(hero[1]/tileset)]&&map[Math.round(hero[1]/tileset)][Math.round(hero[0]/tileset)]==1){
    speed-=0.5;
  }
  if(speed<0) speed = 0;
  hero[0] += moveX*speed;
  hero[1] += moveY*speed;
  if(hero[0]<hero[2]) hero[0] = hero[2]; // hero limits
  if(hero[1]<hero[2]) hero[1] = hero[2];
  if(hero[0]>mapPixels - hero[2]) hero[0] = mapPixels - hero[2];
  if(hero[1]>mapPixels - hero[2]) hero[1] = mapPixels - hero[2];
  updateCamera();

  hero[3] = getAngle([hero[0]+viewPort[0], hero[1]+viewPort[1]], coords);

  hero[5]+=(t*25*(coords[2]*8+1))
  hero[5]%=360

  var killer = collideElements(hero);
  if(killer)die(killer);
  // if fire shots fire
  if(coords[2]&&hero[6]<=0&&hero[8]<=0){
    bullets.push([hero[0]+shake(1, 2+hero[7]/30), hero[1]+shake(1, 2+hero[7]/30), 2, hero[3]+shake(1, 0.05+0.001*hero[7])])
    play(fireSounds[~~(getRandomValue(fireSounds.length))]);
    hero[6] = 1/hero[7]; //12bullets per second  
  }else{
    hero[6]-=dt;
  }

  if(coords[3]&&hero[8]<=0&&hero[9]<=0){
    play(heroSpeedUp);
    hero[8] = 0.55;
    hero[9] = 1.2;
  }else{
    hero[8]-=dt;
    hero[9]-=dt;
  }
}

// PewPlay: the camera follows the hero and stops ~30px past the map borders
// (same limits as the original 800x600 view, generalized to any view size)
function updateCamera(){
  var margin = 30;
  viewPort[0] = cameraAxis(FW/2 - hero[0], FW, margin);
  viewPort[1] = cameraAxis(FH/2 - hero[1], FH, margin);
}
function cameraAxis(value, size, margin){
  var min = size - mapPixels - margin, max = margin;
  if (min > max) return (size - mapPixels) / 2;
  return Math.max(min, Math.min(max, value));
}

function update(dt){

  if(!gameOver) playerUdate(dt);

  // update bullets
  bulletsCycle: for (var i = bullets.length-1; i >= 0; i--) {
    var bullet = bullets[i];
    bullet[0] += Math.cos(bullet[3])*t*bullet[2]; // bullet speed *2
    bullet[1] += Math.sin(bullet[3])*t*bullet[2];
    if(bullet[0]<-20||bullet[0]>mapPixels+20||bullet[1]<-20||bullet[1]>mapPixels+20) bullets.splice(i,1);

    var enemy = collideElements(bullet);
    if(enemy){
      if(--enemy[6]>0){
        createParticles(bullet[0], bullet[1], -bullet[3], 2,10,9);
      }
      bullets.splice(i,1);
      enemy[4]=200
      if(enemy[5]>9)
      play(hitSounds[~~(getRandomValue(hitSounds.length))]);
    }
  }

  //update particles
  for(var i=0;i<particles.length;i++){
    var particle = particles[i];
    particle[0] += Math.cos(particle[2])*getRandomValue(3,2);
    particle[1] += Math.sin(particle[2])*getRandomValue(3,2);
    if(--particle[3]<0) particles.splice(i,1)
  }

  // update enemies 
  if(totemDieShakes>0)totemDieShakes-=0.1;
  spatialhashing = {};
  for (var i = enemies.length-1; i >=0; i--) {
    updateEnemy(enemies[i], i);
  }
  updateTrigger();
  updateSummons();
}

function shake(cond, val){
  return cond?getRandomValue(val*2,-val):0;
}

/**
helper function to draw paths. 
*/
function path(xpts, ypts, size){
  ctx.moveTo(xpts[0]*size, ypts[0]*size);
  for (var i = 1; i<xpts.length; i++) {
    ctx.lineTo(xpts[i]*size, ypts[i]*size);
  }
  ctx.lineTo(xpts[0]*size, ypts[0]*size);
}

function createParticles(x, y, angle, many, life, color){
  for (var h = -many; h < many; h++) {
    particles.push([x, y, getRandomValue(particleZ*h,angle), life||60, color]);
  }
}


function draw(t){
  // draw map
  //some random points 
  setContextAtrribute(7,1);
  ctx.fillRect(0,0,FW, FH);
  setRandomColor(180,0, 185,0,185,0,0,1);
  for(var i=0;i<6;i++)
    ctx.fillRect(~~(getRandomValue(FW)), ~~(getRandomValue(FH)), 2, 2);
  
  // draw map 
  ctx.save()
  var gridSize = H/mapSize
  ctx.beginPath();
  shakeScreen = !gameOver?[shake(coords[2]||totemDieShakes>0, totemDieShakes+2), shake(coords[2]||totemDieShakes>0, totemDieShakes+2)]:[0,0];
  setContextAtrribute(-1,1,'rgba(7,8,12,'+ (0.2-(hero[8]>0?0.1:0)) +')');
  ctx.translate(viewPort[0]+shakeScreen[0], viewPort[1]+shakeScreen[1]);
  ctx.fillRect(0, 0, mapPixels, mapPixels);

  setContextAtrribute(1);
  ctx.beginPath();
  for(var i = 0; i <= mapSize; i++){
    crossLine(i*tileset-0.5, 0, mapPixels);
  }
  ctx.stroke();
  ctx.beginPath();
  setContextAtrribute(5);
  for(var i = 0; i <= mapSize; i++){
    crossLine(i*tileset+0.5, 0, mapPixels);
  }
  ctx.stroke();
  ctx.restore();

  // draw corruption 
  ctx.save();
  ctx.beginPath();
  setContextAtrribute(8,1);  //fillstyle
  setContextAtrribute(2);    //stroke style
  for (var j = 0; j < mapSize; j++) {
    for (var i = 0; i < mapSize; i++) {
      if(map[j][i]==0) continue;
      ctx.fillRect(i*tileset+viewPort[0]+shakeScreen[0], j*tileset+viewPort[1]+shakeScreen[1], tileset, tileset);
      ctx.strokeRect(i*tileset+viewPort[0]+shakeScreen[0]-0.5, j*tileset+viewPort[1]+shakeScreen[1]-0.5, tileset+2, tileset+2);
      //ctx.strokeRect(i*tileset+viewPort[0]+shakeScreen[0]+1.5, j*tileset+viewPort[1]+shakeScreen[1]+1.5, tileset-2, tileset-2);
    }
  }
  ctx.stroke();
  ctx.beginPath();
  setContextAtrribute(2);
  for (var j = 0; j < mapSize; j++) {
    for (var i = 0; i < mapSize; i++) {
      if(map[j][i]==0) continue;
      ctx.strokeRect(i*tileset+viewPort[0]+shakeScreen[0]+0.5, j*tileset+viewPort[1]+shakeScreen[1]+0.5, tileset, tileset);
    }
  }
  ctx.fill();
  ctx.closePath();
  ctx.restore();

  // draw summons 
  ctx.save();
  drawSummons();
  ctx.restore();

  // draw hero
  ctx.save();
  ctx.translate(hero[0] + viewPort[0], hero[1] + viewPort[1]);
  ctx.rotate(hero[3]+Math.PI/2);
  // strokeWidth to 3
  setContextAtrribute(-1,2,2);
  // strokeStyle to colors[6]
  setContextAtrribute(6);
  ctx.beginPath();
  path(heroShape[0], heroShape[1],hero[2]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // draw enemies
  ctx.save();
  for (var i = 0; i < enemies.length; i++) {
    drawEnemy(enemies[i])
  }
  ctx.closePath();
  ctx.restore();

  // draw bullets 
  ctx.save();
  setContextAtrribute(9,1);//fill
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i];
    if(bullet[0]+viewPort[0]<20||bullet[0]+viewPort[0]>W-20||bullet[1]+viewPort[1]<20||bullet[1]+viewPort[1]>H-20) continue
    ctx.beginPath();
    ctx.arc(bullet[0]+viewPort[0], bullet[1]+viewPort[1], bullet[2], 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();


  //draw particles 
  ctx.save();
  //setRandomColor(125,50, 125,50,125,50,0,1);
//  setContextAtrribute(1)
  for (var i = 0; i < particles.length; i++) {
    var particle = particles[i];
    if(particle[0]+viewPort[0]<5||particle[0]+viewPort[0]>W-5||particle[1]+viewPort[1]<5||particle[1]+viewPort[1]>H-5) continue
    ctx.beginPath();
    //ctx.globalAlpha = particle[3]/100;
    setContextAtrribute(particle[4],1);
    //setRandomColor(125,particle[4], 125,particle[5],125,particle[6],0,particle[3]/100);
    ctx.arc(particle[0]+viewPort[0]+shakeScreen[0], particle[1]+viewPort[1]+shakeScreen[1], 2, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ui
  ctx.save();
  displayWord(message, FW/2+1, FH-99, fitWordSize(message, 14, FW-40), [26,21,21]);
  if(gameOver){
    setContextAtrribute(22,1);
    ctx.fillRect(0,0,FW, FH);
    var cy = FH/2;
    if(godMode){
      displayWord('evil mode', FW/2, cy-220,22, [0,16]);
    }
    if(newRecord){
      displayWord('-new record-', FW/2, cy-60,22, [10,18]);
    }else{
      displayWord('game over', FW/2, cy-60,20, [0,13]);
    }
    displayWord(score.toFixed(0), FW/2, cy-140,newRecord?20:16, [0,9]);
    if(!newRecord && record>0){
      displayWord('best '+record.toFixed(0), FW/2, cy+20+BH+30, 9, [24,3]);
    }
  }else{
    //wave
    displayWord(wave>6?'evil':(wave+'/6'), FW/2, 60,9, [0,3]);
    //score
    displayWord(score.toFixed(0), FW-50, 60,18, [32,9],1);
    //record
    var lrd = score>record?'record':record.toFixed(0);
    displayWord(lrd, FW-50, 110,9, [24,3],1);
  }
  ctx.restore();

}

// PewPlay: fixed 60 Hz game steps (the original advanced some counters once per
// rendered frame, so it ran faster on 120 Hz screens), rendering once per frame,
// paused while the page is hidden.
var STEP = 1/60;
var lastTime = 0, accumulator = 0, running = true, rafId = 0;

function step(){
  dt = STEP;
  frame++;
  applyInput();

  // update changes
  if(splashScreen)updateSplash(dt);
  else if(bannerEndMessage)updateEnds();
  else if(GLITCHS[6]<0)update(dt);
  if(!splashScreen) updateCamera();

  if(splashScreen||gameOver){
    switch(frame){
      case 240:
      case 280:
      case 500:
      randomGlitch();
      play(openingGlitch);
      break;
      case 700:
      frame=0;
      break;
    }
  }

  if(fade>0){
    fade+=0.05;
    if(fade>0.5&&fade<0.55)play(gameStarts);
  }
  if(fade>1){
    splashScreen=false;
    fade=0;
    controlHelp=false;
    init();
  }
  bannerScreen = bannerCounter>0;
  if(bannerScreen){
    bannerCounter-=1;
  }
  tickGlitches();
  if(!gameOver&&!splashScreen) score += dt*1000*(hero[8]>0?slowMotion:1);
}

function render(){
  //update buttons
  updateButtons();
  refreshTouchUI();

  ctx.setTransform(RS,0,0,RS,0,0);
  ctx.save();
  // draw game
  if(splashScreen)drawSplash();
  else if(!bannerScreen) draw(dt);

  // draw buttons
  if(!bannerScreen&&!bannerEndMessage)drawPointer();
  ctx.save();
  drawButtons();
  ctx.restore();
  if(bannerScreen)drawBanner();
  else if(bannerEndMessage)drawBannerEnds();

  if(fade>0&&fade<1){
    setContextAtrribute(-1,1,'rgba(220,220,220,'+fade+')');
    ctx.fillRect(0,0,FW, FH);
  }
  ctx.restore();

  // webgl postprocessing
  drawPostProcessing();
}

function loop(time){
  rafId = 0;
  if(!running) return;
  if(!lastTime) lastTime = time;
  accumulator += Math.min(0.25, (time-lastTime)/1000);
  lastTime = time;
  var steps = 0;
  while(accumulator >= STEP && steps < 4){
    step();
    accumulator -= STEP;
    steps++;
  }
  if(steps == 4) accumulator = 0;
  render();
  rafId = requestAnimationFrame(loop);
}

function pauseGame(){
  running = false;
  releaseAll();
  if(rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  if(audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(function(){});
}
function resumeGame(){
  if(running) return;
  running = true;
  lastTime = 0;
  accumulator = 0;
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(function(){});
  if(!rafId) rafId = requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', function(){
  if(document.hidden) pauseGame(); else resumeGame();
});

layoutListeners.push(positionTouchUI);
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', function(){ setTimeout(resize, 150); });
resize();
refreshControlTexts();
refreshTouchUI();
rafId = requestAnimationFrame(loop);

}());
