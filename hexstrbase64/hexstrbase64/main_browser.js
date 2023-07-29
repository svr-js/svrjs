//Requires base64_browser.js
var HexStrBase64Buffer = {
	from: function(s, e) {
		var type = e;
		var value = '';
		if (e == 'base64') {
			value = base64.decode(s);
		} else if (e == 'hex') {
			try {
				var escaped = "";
				var hex = "";
				if(s.length%4 > 0) {
				  for(i=0;i<(4-(s.length%4));i++) {
				    hex += "0";
				  }
				}
				hex += s;
				for(var i = 0;i<hex.length;i += 4) {
				  escaped += new String("%u" + hex.charAt(i) + hex.charAt(i + 1) + hex.charAt(i + 2) + hex.charAt(i + 3)).toString().split("undefined").join("");
				}
				value = unescape(escaped).split(unescape("%00")).join("");
			} catch (ex) {
				var modex = ex.toString().split('Error: ');
				modex[0] = '';
				if (typeof modex == 'object') {
					throw new Error(
						'Invaild hex input: ' + s + '. Reason: ' + modex.join('')
					);
				} else {
					throw new Error('Invaild hex input: ' + s + '. Reason: ' + ex);
				}
			}
		} else {
			value = new TextDecoder(e).decode(new TextEncoder('utf8').encode(s));
		}
		//function toStringE(en,type) {
		function toString(en) {
			if (en == 'base64') {
				return base64.encode(value);
			} else if (en == 'hex') {
				var result = "";
				for(var i=0;i<value.length;i++) {
				  var unicode = escape(value.charAt(i));
				  var hex = "";
				  if(value.charAt(i) == "\n") {
				    hex = "000a";
				  } else if(value.charAt(i) == "\r") {
				    hex = "000d";
				  } else if(value.charAt(i) == " ") {
				    hex = "0020";
				  } else if(value.charAt(i) == "\0") {
				    hex = "";
				  } else if(unicode == value.charAt(i)) {
				    var oldhex = value.charCodeAt(i).toString(16);
				    var newhex = "";
				    if(oldhex.length < 4) {
				      for(var j=0;j<4-(oldhex.length%4);j++) {
				        newhex += "0";
				      }
				      newhex += oldhex;
				    } else {
				      newhex = oldhex;
				    }
				    hex = newhex;
				  } else {
				    hex = unicode.split("%u").join("");
				  }
				  if(hex.length == 4 || hex === "") {
				    result += hex;
				  } else if(hex.length > 4) {
				    result += hex.substring(hex.length-5,hex.length-1);
				  } else if(hex.length < 4) {
				    for(var j=0;j<=4-(hex.length%4);j++) {
				      result += "0";
				    }
				    result += hex;
				  }
				}
				return result.split("undefined").join("").split("%").join("");
			} else {
				//return new TextDecoder(en).decode(new TextEncoder(type).encode(value));
				return new TextDecoder(en).decode(new TextEncoder("utf8").encode(value));
			}
		}
		//function toString(en) {
		  //return toStringE(en,type);
		//}
		return { type: type, value: value, toString: toString };
	}
};
var hexstrbase64 = {
	strtobase64: function(s) {
		return HexStrBase64Buffer.from(s, 'utf8').toString('base64');
	},
	base64tostr: function(b) {
		return HexStrBase64Buffer.from(b, 'base64').toString('utf8');
	},
	strtohex: function(s) {
		return HexStrBase64Buffer.from(s, 'utf8').toString('hex');
	},
	hextostr: function(h) {
		return HexStrBase64Buffer.from(h, 'hex').toString('utf8');
	},
	hextobase64: function(h) {
		return hexstrbase64.strtobase64(hexstrbase64.hextostr(h));
	},
	base64tohex: function(b) {
		return hexstrbase64.strtohex(hexstrbase64.base64tostr(b));
	},
	cipher: function() {
		this.strtobase64 = hexstrbase64.strtobase64;
		this.base64tostr = hexstrbase64.base64tostr;
		this.strtohex = hexstrbase64.strtohex;
		this.hextostr = hexstrbase64.hextostr;
		this.hextobase64 = hextobase64.hextobase64;
		this.base64tohex = hextobase64.base64tohex;
	},
	native: {
		btoa: function(b) {
			return hexstrbase64.strtobase64(b);
		},
		atob: function(a) {
			return hexstrbase64.base64tostr(a);
		}
	}
};