/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var identifier = require('../../common/util/identifier');


/**
 * Process a raw Bluetooth Low Energy radio payload into semantically
 * meaningful information.
 * address.  Note that the payload is LSB first.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {AdvA48} Advertiser address identifier.
 */
function process(payload) {
  var advA48 = toAdvertiserAddress(payload.substr(4,12));
  advA48.advHeader = toAdvertiserHeader(payload.substr(0,4));
  advA48.advData = toAdvertiserData(payload.substr(16));
  return advA48;
}


/**
 * Convert a raw Bluetooth Low Energy advertiser address.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {Object} 48-bit advertiser address.
 */
function toAdvertiserAddress(payload) {
  var advAString = payload.substr(10,2);
  advAString += payload.substr(8,2);
  advAString += payload.substr(6,2);
  advAString += payload.substr(4,2);
  advAString += payload.substr(2,2);
  advAString += payload.substr(0,2);
  return new identifier(identifier.ADVA48, advAString);
}


/**
 * Convert a raw Bluetooth Low Energy advertiser header into its meaningful
 * parts.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {Object} Semantically meaningful advertiser header.
 */
function toAdvertiserHeader(payload) {
  var addressType = parseInt(payload.substr(0,1),16);
  var typeCode = payload.substr(1,1);
  var length = parseInt(payload.substr(2,2),16) % 64;
  var rxAdd = "public";
  var txAdd = "public";
  if(addressType & 0x8) {
    rxAdd = "random";
  }
  if(addressType & 0x4) {
    txAdd = "random";
  }   
  var type;
  switch(typeCode) {
    case("0"):
      type = "ADV_IND";
      break;
    case("1"):
      type = "ADV_DIRECT_IND";
      break;
    case("2"):
      type = "ADV_NONCONNECT_IND";
      break;
    case("3"):
      type = "SCAN_REQ";
      break;
    case("4"):
      type = "SCAN_RSP";
      break;
    case("5"):
      type = "CONNECT_REQ";
      break;
    case("6"):
      type = "ADV_DISCOVER_IND";
      break;
  }
  return { type: type,
           length: length,
           txAdd: txAdd,
           rxAdd: rxAdd
  };
}


/**
 * Convert a raw Bluetooth Low Energy advertiser header into its meaningful
 * parts.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {Object} Semantically meaningful advertiser header.
 */
function toAdvertiserData(payload) {
  var advertiserDataLength = payload.length;
  var cursor = 0;
  var advertiserData = {};
  while(cursor < advertiserDataLength) {
    var length = (parseInt(payload.substr(cursor,2),16) + 1) * 2;
    var tag = payload.substr(cursor+2,2);
    switch(tag) {
      case("01"):
        parseFlags(payload, cursor, advertiserData);
        break;
      case("02"):
        parseNonComplete16BitUUIDs(payload, cursor, advertiserData);
        break;
      case("03"):
        parseComplete16BitUUIDs(payload, cursor, advertiserData);
        break;
      case("06"):
        parseNonComplete128BitUUIDs(payload, cursor, advertiserData);
        break;
      case("07"):
        parseComplete128BitUUIDs(payload, cursor, advertiserData);
        break;
      case("08"):
        parseShortenedLocalName(payload, cursor, advertiserData);
        break;
      case("09"):
        parseCompleteLocalName(payload, cursor, advertiserData);
        break;
      case("0a"):
        parseTxPower(payload, cursor, advertiserData);
        break;
      case("12"):
        parseSlaveConnectionIntervalRange(payload, cursor, advertiserData);
        break;
      case("14"):
        parseSolicitation16BitUUIDs(payload, cursor, advertiserData);
        break;
      case("15"):
        parseSolicitation128BitUUIDs(payload, cursor, advertiserData);
        break;
      case("16"):
        parseServiceData(payload, cursor, advertiserData);
        break;
      case("ff"):
        parseManufacturerSpecificData(payload, cursor, advertiserData);
        break;
      default:
        console.log("Unhandled BLE tag");
    }
    cursor += length;
  }
  return advertiserData;
}


/**
 * Parse BLE advertiser data flags.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseFlags(payload, cursor, advertiserData) {
  var flags = parseInt(payload.substr(cursor+4,2),16);
  var result = [];
  if(flags & 0x01) {
    result.push("LE Limited Discoverable Mode");
  }
  if(flags & 0x02) {
    result.push("LE General Discoverable Mode");
  }
  if(flags & 0x04) {
    result.push("BR/EDR Not Supported");
  }
  if(flags & 0x08) {
    result.push("Simultaneous LE and BR/EDR to Same Device Capable (Controller)");
  }
  if(flags & 0x10) {
    result.push("Simultaneous LE and BR/EDR to Same Device Capable (Host)");
  }
  advertiserData.flags = result;
}


/**
 * Parse BLE advertiser non-complete 16-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseNonComplete16BitUUIDs(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.nonComplete16BitUUIDs = result;
}


/**
 * Parse BLE advertiser complete 16-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseComplete16BitUUIDs(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.complete16BitUUIDs = result;
}


/**
 * Parse BLE advertiser non-complete 128-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseNonComplete128BitUUIDs(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.nonComplete128BitUUIDs = result;
}


/**
 * Parse BLE advertiser complete 128-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseComplete128BitUUIDs(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.complete128BitUUIDs = result;
}


/**
 * Parse BLE advertiser data non-complete shortened local name.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseShortenedLocalName(payload, cursor, advertiserData) {
  var hexName = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var result = "";
  for(var cChar = 0; cChar < hexName.length; cChar += 2)
    result += String.fromCharCode(parseInt(hexName.substr(cChar,2),16));
  advertiserData.shortenedLocalName = result;
}


/**
 * Parse BLE advertiser data complete local name.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseCompleteLocalName(payload, cursor, advertiserData) {
  var hexName = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var result = "";
  for(var cChar = 0; cChar < hexName.length; cChar += 2)
    result += String.fromCharCode(parseInt(hexName.substr(cChar,2),16));
  advertiserData.completeLocalName = result;
}


/**
 * Parse BLE advertiser TX power.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseTxPower(payload, cursor, advertiserData) {
  var txPower = parseInt(payload.substr(cursor+4,2),16);
  if(txPower > 127) {
    txPower -= 255;
  }
  advertiserData.txPower = txPower + "dBm";
}


/**
 * Parse BLE advertiser data slave connection interval range.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseSlaveConnectionIntervalRange(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.slaveConnectionIntervalRange = result;
}


/**
 * Parse BLE advertiser data service solicitation 16-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseSolicitation16BitUUIDs(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.solicitation16BitUUIDs = result;
}


/**
 * Parse BLE advertiser data service solicitation 128-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseSolicitation128BitUUIDs(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.solicitation128BitUUIDs = result;
}


/**
 * Parse BLE advertiser data service data.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseServiceData(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.serviceData = result;
}


/**
 * Parse BLE advertiser data manufacturer specific data.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseManufacturerSpecificData(payload, cursor, advertiserData) {
  var companyIdentifierCode = payload.substr(cursor+6, 2);
  companyIdentifierCode += payload.substr(cursor+4, 2);
  var data = payload.substr(cursor+8, getTagDataLength(payload, cursor)-4);
  advertiserData.manufacturerSpecificData = {
                                 companyIdentifierCode: companyIdentifierCode,
                                 data: data };
}


/**
 * Calculate the length of the data (flag excluded) of a BLE tag.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 */
function getTagDataLength(payload, cursor) {
  return (parseInt(payload.substr(cursor,2),16) - 1) * 2;
}


module.exports.process = process;