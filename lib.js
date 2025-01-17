const regstart = '[(]?';
const regend = '([^a-z]|$)';
const skipbrackets = '(?! [(][0-9]|\u200B\u3010)';
const unitSuffix = '(?! [(][0-9]| ?\u200B\u3010)(?:[^a-z]|$)';
const unitSuffixInFt = '(?! ?[(-−\u00A0]?[0-9]| ?\u200B\u3010)(?:[^a-z²³\u3010\u200B)]|$)';
const notInPlusQualifier = '(?!in\\s*(?:a|an|the|my|his|her|hers|their|theirs|our|ours|your|yours)\\b)';
const sqcu = '(?:[-− \u00A0]?(square|sq\\.?|cubic|cu\\.?))?';
const skipempty = '^(?:\\s+)?';

const numberPattern = [
    '(',
            // main number
            '(?:[+\\-−\\d,\\.][\\d,  \\.]*(?:e[+\-]?[0-9]+)?)',
        '|',
            // fraction
            '(?:',
                // Unicode fraction
                    '(?:[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])',
                '|',
                // ASCII fraction
                    '(?:\\d+\\s*[/÷∕⁄]\\s*\\d+)',
            ')',
        '|',
            // main number
            '(?:[+\\-−\\d,\\.][\\d,  \\.]*(?:e[+\-]?[0-9]+)?)',
            '(?:\\s*|-)',
            // fraction
            '(?:',
                // Unicode fraction
                    '(?:[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])',
                '|',
                // ASCII fraction
                    '(?:\\d+\\s*[/÷∕⁄]\\s*\\d+)',
            ')',
    ')(?<!\\s)',
].join('');

/** @type{ RegExp } */
var feetInchRegex;

/** @type{ { [key: string]: number } } */
const fractions = {
    '¼': 1 / 4,
    '½': 1 / 2,
    '¾': 3 / 4,
    '⅐': 1 / 7,
    '⅑': 1 / 9,
    '⅒': 1 / 10,
    '⅓': 1 / 3,
    '⅔': 2 / 3,
    '⅕': 1 / 5,
    '⅖': 2 / 5,
    '⅗': 3 / 5,
    '⅘': 4 / 5,
    '⅙': 1 / 6,
    '⅚': 5 / 6,
    '⅛': 1 / 8,
    '⅜': 3 / 8,
    '⅝': 5 / 8,
    '⅞': 7 / 8
};

/** @type{string[]} */
const units = [];

/** @type{RegExp?} */
let otherUnitsRegex = null;

/** Register a pattern for a US customary or imperial unit marker
 *  @param {string} pattern - The pattern for the unit
 *  @return {RegExp} - A regex matching the unit as a full string, case-insensitive
 */
function unitPattern(pattern) {
    if (otherUnitsRegex !== null) {
        throw Error('unitPattern must not be called after getOtherUnitsRegex');
    }
    units.push(pattern);
    return RegExp('^(?:' + pattern + ')$', 'i');
}

/** Regex for matching all the other values in US customary or imperial units
 *  @return {RegExp} - The regex
 */
function getOtherUnitsRegex() {
    if (otherUnitsRegex === null) {
        otherUnitsRegex = new RegExp(regstart + '(?:in)?(?:[a-z#$€£(](?!\\s))?' + numberPattern + sqcu + '[-−\\s]*' + notInPlusQualifier + '(' + units.join('|') + ')(?:²|³)?[)]?' + unitSuffixInFt, 'ig');
    }
    return otherUnitsRegex;
}

/** @type{ import("./types").Conversion } */
const fahrenheitConversion = {
    // regexUnit is set in parseUnitOnly
    unit: '°C',
    multiplier: 1
};

/** @type{ import("./types").Conversion } */
const inchConversion = {
    regex: unitPattern('inches|inch|in'),
    unit: 'cm',
    unit2: 'mm',
    multiplier: 2.54,
    multiplier2: 25.4,
    multipliercu: 0.0163871,
    forceround2: true
};

/** @type{ import("./types").Conversion } */
const footConversion = {
    // regex is set in setIncludeImproperSymbols
    unit: 'm',
    multiplier: 0.3048
};

const footRegexWithImproperSymbols = unitPattern('[\'′’](?![\'′’])');
const footRegexWithoutImproperSymbols = unitPattern('[′](?![′])');

/** @type{ import("./types").Conversion[] } */
const conversions = [
    fahrenheitConversion,
    inchConversion,
    footConversion,
    {
        regex: unitPattern('feet|foot|ft'),
        unit: 'm',
        multiplier: 0.3048,
        multipliercu: 28.31690879986443
    },
    {
        regex: unitPattern('miles?|mi'),
        unit: 'km',
        multiplier: 1.60934,
        forceround2: true
    },
    {
        regex: unitPattern('yards?|yd'),
        unit: 'm',
        multiplier: 0.9144
    },
    {
        regex: unitPattern('mph'),
        unit: 'km\/h',
        multiplier: 1.60934,
        forceround2: true,
        forceround: true
    },
    {
        regexUnit: new RegExp(skipempty + '(pound|lb)s?' + skipbrackets + regend, 'ig'),
        regex: unitPattern('(?:pound|lb)s?'),
        unit: 'kg',
        unit2: 'g',
        multiplier: 0.453592,
        multiplier2: 453.592,
        forceround2: true
    },
    {
        regexUnit: new RegExp(skipempty + '(ounces?|oz)' + skipbrackets + regend, 'ig'),
        regex: unitPattern('ounces?|oz'),
        unit: 'g',
        multiplier: 28.3495,
        forceround: true
    },
    {
        regexUnit: new RegExp(skipempty + 'fl(uid)? ?(ounces?|oz)' + skipbrackets + regend, 'ig'),
        regex: unitPattern('fl(?:uid)? ?(?:ounces?|oz)'),
        unit: 'mL',
        multiplier: 29.5735,
        forceround: true,
        multiplierimp: 28.4131
    },
    {
        regexUnit: new RegExp(skipempty + 'gal(lons?)' + skipbrackets + regend, 'ig'),
        regex: unitPattern('gal(?:lons?)?'),
        unit: 'L',
        multiplier: 3.78541,
        multiplierimp: 4.54609
    },
    {
        regexUnit: new RegExp(skipempty + '^pints?' + skipbrackets + regend, 'ig'),
        regex: unitPattern('pints?'),
        unit: 'L',
        unit2: 'mL',
        multiplier: 0.473176,
        multiplier2: 473.176,
        forceround2: true,
        multiplierimp: 0.568261
    },
    {
        regexUnit: new RegExp(skipempty + 'cups?'+skipbrackets + regend, 'ig'),
        regex: unitPattern('cups?'),
        unit: 'mL',
        multiplier: 236.59,
        forceround: true,
        multiplierimp: 284.131
    },
    {
        regexUnit: new RegExp(skipempty + '(qt|quarts?)' + skipbrackets + regend, 'ig'),
        regex: unitPattern('qt|quarts?'),
        unit: 'L',
        multiplier: 0.946353,
        multiplierimp: 1.13652
    },
    {
        regex: unitPattern('stones?'),
        unit: 'kg',
        multiplier: 6.35029
    },
    {
        regex: unitPattern('acres?'),
        unit: 'ha',
        multiplier: 0.4046856422
    },
    {
        regex: unitPattern('horsepower?'),
        unit: 'kW',
        multiplier: 0.745699872
    },
];

/** @type{ import("./types").Conversion } */
const unitsTablespoon = {
    regexUnit: new RegExp(skipempty + '(tbsp|tablespoons?)'+skipbrackets + regend, 'ig'),
    regex: unitPattern('tbsp|tablespoons?'),
    unit: 'mL',
    multiplier: 14.7868,
    forceround: true,
    multiplierimp: 17.7582
};

/** @type{ import("./types").Conversion } */
const unitsTeaspoon = {
    regexUnit: new RegExp(skipempty + '(tsp|teaspoons?)'+skipbrackets + regend, 'ig'),
    regex: unitPattern('tsp|teaspoons?'),
    unit: 'mL',
    multiplier: 4.92892,
    forceround: true,
    multiplierimp: 5.91939
};

/** If the value if smaller than 1, or larger than 10,000, use a more convenient SI prefix
 *  @param {number} met - The value
 *  @param {string} unit - The unit being used
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @return {import("./types").ValueWithUnit} - The scaled value with the appropriate unit
 */
function stepUpOrDown(met, unit, useMM, useGiga) {
    if (met < 1) {
        switch (unit) {
            case 'cm':
                met = met * 10;
                unit = "mm";
                break;
            case 'm':
                if (useMM === true) {
                    met = met * 1000;
                    unit = "mm";
                } else {
                    met = met * 100;
                    unit = "cm";
                }
                break;
            case 'km':
                met = met * 1000;
                unit = "m";
                break;
            case 'kg':
                met = met * 1000;
                unit = "g";
                break;
            case 'L':
                met = met * 1000;
                unit = "mL";
                break;
        }
    } else if (met > 10000) {
        if (useGiga) {
            if (met > 100000000) {
                switch (unit) {
                    case 'm':
                        met = met / 1000000000;
                        unit = "Gm";
                        break;
                    case 'g':
                        met = met / 1000000000;
                        unit = "Gg";
                        break;
                    case 'L':
                        met = met / 1000000000;
                        unit = "GL";
                        break;
                    case 'km':
                        met = met / 1000000;
                        unit = "Gm";
                        break;
                    case 'kg':
                        met = met / 1000000;
                        unit = "Gg";
                        break;
                }
            }
            if (met > 100000) {
                switch (unit) {
                    case 'm':
                        met = met / 1000000;
                        unit = "Mm";
                        break;
                    case 'g':
                        met = met / 1000000;
                        unit = "Mg";
                        break;
                    case 'L':
                        met = met / 1000000;
                        unit = "ML";
                        break;
                    case 'km':
                        met = met / 1000;
                        unit = "Mm";
                        break;
                    case 'kg':
                        met = met / 1000;
                        unit = "Mg";
                        break;
                    case 'kL':
                        met = met / 1000;
                        unit = "ML";
                        break;
                }
            }
            if (met > 1000) {
                if (unit === 'L') {
                    met = met / 1000;
                    unit = "KL";

                }
            }
        }

        switch (unit) {
            case 'mm':
                if (useMM === true) {
                    met = met / 1000;
                    unit = "m";
                } else {
                    met = met / 100;
                    unit = "cm";
                }
                break;
            case 'cm':
                met = met / 100;
                unit = "m";
                break;
            case 'm':
                met = met / 1000;
                unit = "km";
                break;
            case 'g':
                met = met / 1000;
                unit = "kg";
                break;
            case 'mL':
                met = met / 1000;
                unit = "L";
                break;
        }
    }


    return {
        met: met,
        unit: unit
    };
}

/** Create a new string where toInsert has been inserted in target at the position index
 *  @param {string} target - The string where toInsert should be inserted
 *  @param {string} toInsert - The string to insert
 *  @param {number} index - The position where toTarget should be inserted
 *  @return {string} - A new string with toInsert at position index
*/
function insertAt(target, toInsert, index) {
    return target.substr(0, index) + toInsert + target.substr(index);
}

/** Return true when the value does not need to be converted further
 *  @param {string} text - The text containing a non-metric value
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @return {boolean} - Whether the value should not be converted to metric
*/
function shouldConvert(text, convertBracketed) {
    if (/\u3010/.test(text)) { // the text contains 【
        return false;
    }
    if (convertBracketed) {
        // if the value is followed by a parenthesis, it is probably already converted. ex: 1 in (2.54 cm)
        return !/[(]/.test(text.substring(1));
    } else {
        // if the text has parentheses, it is either within parentheses, or probably already converted
        return !/[()]/.test(text);
    }
}

/** Convert a temperature from Fahrenheit to Celsius or Kelvin
 *  @param {number} f - A value in Fahrenheit
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {number} - The value in Celsius
*/
function fahrenheitToMetric(f, useKelvin, useRounding) {
    if (useKelvin) {
        return roundNicely(273.15 + (5 / 9) * (f - 32), useRounding);
    } else {
        return Math.round((5 / 9) * (f - 32));
    }
}

/** Round a number
 *  @param {number} v - The number
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {number} - The rounded number
*/
function roundNicely(v, useRounding) {
    if (useRounding) {
        // try rounding to 0 decimal places
        const dec0 = Math.round(v);
        const relative_error0 = Math.abs(1 - (v / dec0));
        if (relative_error0 < .03) {
            // relative error is less than 3 %, OK
            return dec0;
        }

        // try rounding to 1 decimal place
        const dec1 = Math.round(v * 10) / 10;
        const relative_error1 = Math.abs(1 - (v / dec1));
        if (relative_error1 < .03) {
            // relative error is less than 3 %, OK
            return dec1;
        }
    }

    return Math.round(v * 100) / 100;
}

/** Format a number using user preferences for thousand separator and decimal separator
 *  @param {number} v - The number to format
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @return {string} - The formatted number
*/
function formatNumber(v, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator) {
    if (useCommaAsDecimalSeparator) {
        const withThousandSeparator = v.toLocaleString('de-DE');
        if (useSpacesAsThousandSeparator) {
            return withThousandSeparator.replace(/\./g, '\u00A0');
        } else {
            return withThousandSeparator;
        }
    } else {
        const withThousandSeparator = v.toLocaleString('en-US');
        if (useSpacesAsThousandSeparator) {
            return withThousandSeparator.replace(/,/g, '\u00A0');
        } else {
            return withThousandSeparator;
        }
    }
}

/** Decide exactly where the metric-converted value should be inserted in fullMatch
 *  @param {string} fullMatch - The text containing the non-metric value to convert
 *  @return {number} - The relative location where the metric-converted value should be inserted
*/
function convertedValueInsertionOffset(fullMatch) {
    const lastChar = fullMatch[fullMatch.length - 1];
    if (lastChar === undefined) {
        return 0;
    } else if (/[\s \.,;]/.test(lastChar)) {
        return fullMatch.length - 1;
    } else {
        return fullMatch.length;
    }
}

/** Translate text to bold Unicode code-points
 *  @param {string} text - The text to enbolden
 *  @return {string} - The enboldenned text
*/
function bold(text) {
    // convert digits to bold digits
    // 0x1D7EC is 𝟬 (MATHEMATICAL SANS-SERIF BOLD DIGIT ZERO)
    let out = text.replace(/\d/g, (c) => String.fromCodePoint(0x1D7EC - 48 + c.charCodeAt(0)));
    // convert lowercase Latin letters to bold lowercase Latin letters
    // 0x1D7EC is 𝗮 (MATHEMATICAL SANS-SERIF BOLD SMALL A)
    out = out.replace(/[a-z]/g, (c) => String.fromCodePoint(0x1D5EE - 97 + c.charCodeAt(0)));
    // convert uppercase Latin letters to bold uppercase Latin letters
    // 0x1D7EC is 𝗔 (MATHEMATICAL SANS-SERIF BOLD CAPITAL A)
    out = out.replace(/[A-Z]/g, (c) => String.fromCodePoint(0x1D5D4 - 65 + c.charCodeAt(0)));
    return out;
}

/** Format a value with its unit for insertion in the text
 *  @param {string} number - The formatted value
 *  @param {string} unit - The unit of the value
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - The formatted value along with its unit
*/
function formatConvertedValue(number, unit, useBold, useBrackets) {
    let fullstring = `${number} ${unit}`;
    if (useBrackets) {
        // \200B is ZERO WIDTH SPACE
        // \3010 is 【 (LEFT BLACK LENTICULAR BRACKET)
        // \3011 is 】 (RIGHT BLACK LENTICULAR BRACKET)
        // this avoids line-break between original value and converted value
        fullstring = "\u200B\u3010" + fullstring + "\u3011";
    } else {
        fullstring = " (" + fullstring + ")˜";
    }
    if (useBold && useBrackets) {
        fullstring = bold(fullstring);
    }
    return fullstring;
}

/** Generate the RegExp sued by replaceFahrenheit
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @return {RegExp} - The appropriate RegExp
*/
function makeFahrenheitRegex(degWithoutFahrenheit) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    return new RegExp(
        [
            '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([-−]?[0-9,\\.]+)', // digits, optionally prefixed with a minus sign
            // optionally, an additional number after a range marker
            '(?:',
                '(?: to | and |[-−]+)', // range marker
                '([-−]?[0-9,\\.]+)', // digits, optionally prefixed with a minus sign
            ')?',
            '[ \u00A0]?', // space or no-break space
            // degree Fahrenheit marker
            '(?:',
                    '(?:',
                        '(°|º|deg(rees)?)', // degree marker
                        '[ \u00A0]?', // space or no-break space
                        degWithoutFahrenheit ? '': 'F(ahrenheits?)?', // Fahrenheit marker
                    ')',
                '|',
                    '(?:Fahrenheits?)', // as a full word
                '|',
                    '[\u2109]', // Unicode ℉  (DEGREE FAHRENHEIT)
            ')',
            // check for already present conversion to Celsius
            '(?!', // negative look-ahead
                    ' ?', // optional space
                    '[(]',  // opening parenthesis
                    '[0-9]',  // some digit
                '|',
                    ' ?', // optional space
                    '\u200B', // ZERO WIDTH SPACE
                    '\u3010', // 【 (LEFT BLACK LENTICULAR BRACKET)
            ')',
            '(?:[^a-z]|$)', // look for a separator
        ].join(''),
        'ig'
    );
}

const replaceFahrenheitRegexWithSymbol = makeFahrenheitRegex(false);
const replaceFahrenheitRegexWithoutSymbol = makeFahrenheitRegex(true);

/** Return a new string where all occurrences of values in Fahrenheit have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric temperatures
*/
function replaceFahrenheit(text, degWithoutFahrenheit, convertBracketed, useKelvin, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    const regex = degWithoutFahrenheit ? replaceFahrenheitRegexWithoutSymbol : replaceFahrenheitRegexWithSymbol;

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        const firstNumber = match[1];
        if (!firstNumber) {
            continue;
        }
        const secondNumber = match[2];

        // upper-bound of the range, or single value
        const parsed1 = parseNumber(firstNumber);
        if (parsed1 === null) {
            continue;
        }
        const met1 = fahrenheitToMetric(parsed1.value, useKelvin, useRounding);
        const formattedMet1 = formatNumber(met1, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);

        let met = formattedMet1;

        // lower-bound of the range
        if (secondNumber) {
            const parsed2 = parseNumber(secondNumber);
            if (parsed2 === null) {
                continue;
            }
            const met2 = fahrenheitToMetric(parsed2.value, useKelvin, useRounding);
            const formattedMet2 = formatNumber(met2, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
            met += ' to ' + formattedMet2;
        }

        const unit = useKelvin ? 'K' : '°C';
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        const metStr = formatConvertedValue(met, unit, useBold, useBrackets);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

// NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
const replaceVolumeRegex = new RegExp(
    [
        '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
        '([0-9]+(?:\\.[0-9]+)?)', // number
        '[ \u00A0]?', // space or no-break space
        '[x*×]', // multiplication sign
        '[ \u00A0]?', // space or no-break space
        '([0-9]+(?:\\.[0-9]+)?)', // number
        '[ \u00A0]?', // space or no-break space
        '[x*×]', // multiplication sign
        '[ \u00A0]?', // space or no-break space
        '([0-9]+(?:\\.[0-9]+)?)', // number
        '[ \u00A0]?', // space or no-break space
        'in(ches|ch|\\.)?', // unit
        // check for already present conversion to metric
        unitSuffix,
    ].join(''),
    'ig',
);

/** Return a new string where all occurrences of volumes (“L×l×h in”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric volumes
*/
function replaceVolume(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = replaceVolumeRegex.exec(text)) !== null) {
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }
        const dim1 = match[1];
        const dim2 = match[2];
        const dim3 = match[3];
        if (!dim1 || !dim2 || !dim3) {
            continue;
        }
        let scale = 2.54;
        let unit = 'cm';
        if (useMM === true) {
            scale = 25.4;
            unit = 'mm';
        }
        const parsed1 = parseNumber(dim1);
        if (parsed1 === null) {
            continue;
        }
        const parsed2 = parseNumber(dim2);
        if (parsed2 === null) {
            continue;
        }
        const parsed3 = parseNumber(dim3);
        if (parsed3 === null) {
            continue;
        }
        const cm1 = formatNumber(roundNicely(parsed1.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(parsed2.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm3 = formatNumber(roundNicely(parsed3.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2} × ${cm3}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

// NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
const replaceSurfaceInInchesRegex = new RegExp(
    [
        '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
        '([0-9]+(?:\\.[0-9]+)?)', // number
        '[-− \u00A0]?', // space or no-break space
        '[x*×]',  // multiplication sign
        '[-− \u00A0]?', // space or no-break space
        '([0-9]+(?:\\.[0-9]+)?)', // number
        '[-− \u00A0]?', // space or no-break space
        'in(ches|ch|.)?',  // unit
        // check for already present conversion to metric
        unitSuffix,
    ].join(''),
    'ig',
);

/** Return a new string where all occurrences of surfaces in inches (“L×l in”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric surfaces
*/
function replaceSurfaceInInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = replaceSurfaceInInchesRegex.exec(text)) !== null) {
        if (/[0-9][Xx*×][ \u00A0][0-9]/.test(match[0])) {
            continue; //it is 2x 2in something so no conversion
        }
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        const dim1 = match[1];
        const dim2 = match[2];
        if (!dim1 || !dim2) {
            continue;
        }

        let scale = 2.54;
        let unit = 'cm';
        if (useMM === true) {
            scale = 25.4;
            unit = 'mm';
        }
        const parsed1 = parseNumber(dim1);
        if (parsed1 === null) {
            continue;
        }
        const parsed2 = parseNumber(dim2);
        if (parsed2 === null) {
            continue;
        }
        const cm1 = formatNumber(roundNicely(parsed1.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(parsed2.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

// NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
const replaceSurfaceInFeetRegex = new RegExp(
    [
        '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
        '([0-9]+(?:\\.[0-9]+)?)', // number
        '[\'′’]?',  // allow feet symbol on first number
        '[-− \u00A0]?', // space or no-break space
        '[x*×]', // multiplication sign
        '[-− \u00A0]?', // space or no-break space
        '([0-9]+(?:\\.[0-9]+)?)', // number
        '[-− \u00A0]?', // space or no-break space
        '(feet|foot|ft|[\'′’])', // unit
        '(?![0-9])', // maybe to avoid matching feet2 for feet²?
        // check for already present conversion to metric
        unitSuffix
    ].join(''),
    'ig',
);


/** Return a new string where all occurrences of surfaces in feet (“L×l ft”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric surfaces
*/
function replaceSurfaceInFeet(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = replaceSurfaceInFeetRegex.exec(text)) !== null) {
        if (/[0-9][xX*×][ \u00A0][0-9]/.test(match[0])) {
            continue; //it is 2x 2ft something so no conversion
        }
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        const dim1 = match[1];
        const dim2 = match[2];
        if (!dim1 || !dim2) {
            continue;
        }

        let scale = 0.3048;
        let unit = 'm';
        // TODO: use useMM

        const parsed1 = parseNumber(dim1);
        if (parsed1 === null) {
            continue;
        }
        const parsed2 = parseNumber(dim2);
        if (parsed2 === null) {
            continue;
        }
        const m1 = formatNumber(roundNicely(parsed1.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const m2 = formatNumber(roundNicely(parsed2.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${m1} × ${m2}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

// NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
const replaceFeetAndInchesRegex = new RegExp(
    [
        '([0-9]{0,3})', // number
        '.?', // separator
        '(ft|yd|foot|feet)', // larger unit
        '.?', // separator
        '([0-9]+(\\.[0-9]+)?)', // number
        '.?', // separator
        'in(?:ches|ch)?', // smaller unit
    ].join(''),
    'g',
);

/** Return a new string where all occurrences of lengths in feet and inches (“1 ft 2 in”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric lengths
*/
function replaceFeetAndInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = replaceFeetAndInchesRegex.exec(text)) !== null) {
        const dim1 = match[1];
        const larger_unit = match[2];
        const dim2 = match[3];
        if (!dim1 || !larger_unit ||!dim2) {
            continue;
        }

        const yards_or_feet = parseFloat(dim1);
        const inches = parseFloat(dim2);

        const is_yards = new RegExp('yd', 'i');
        const feet = is_yards.test(larger_unit) ? yards_or_feet * 3 : yards_or_feet;
        const total = feet * 12 + inches;
        const m = formatNumber(roundNicely(total * 0.0254, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(m, 'm', useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Round a value, sometimes force to use 0 decimal places
 *  @param {number} met - The value to round
 *  @param {boolean} forceRounding - Round to 0 decimal places anywau
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {number} - The rounded value
*/
function roundMaybeNicely(met, forceRounding, useRounding) {
    if (forceRounding) {
        return Math.round(met);
    } else {
        return roundNicely(met, useRounding);
    }
}

/** Convert and format an unit from unit at unitIndex into metric
 *  @param {number} imp - The value, possibly in imperial units
 *  @param {import("./types").Conversion} conversion - The description of the conversion to apply
 *  @param {string} suffix - Optional '²' or '³'
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {import("./types").ValueWithUnit} - The value with the appropriate unit
*/
function applyConversion(imp, conversion, suffix, isUK, useMM, useGiga, useRounding) {
    let multiplier = conversion.multiplier;
    if (isUK === true && conversion.multiplierimp !== undefined) {
        multiplier = conversion.multiplierimp;
    }
    let unit = conversion.unit;
    if (useMM === true && conversion.multiplier2 !== undefined && conversion.unit2 !== undefined) {
        unit = conversion.unit2;
        multiplier = conversion.multiplier2;
    }
    const forceRounding = (useRounding === false &&
        ((useMM === true && conversion.multiplier2 !== undefined && conversion.forceround2) || conversion.forceround === true));

    let met;
    /*if (unitIndex < 2 ) {
        met = fahrenheitToCelsius(imp, useKelvin);
        if (useKelvin) {
            met += 273.15;
            met = roundNicely(met, useRounding);
            unit = 'K';
        }
    } else*/
    if (suffix === '²')
        met = roundMaybeNicely(imp * Math.pow(multiplier, 2), forceRounding, useRounding);
    else if (suffix === '³') {
        if (conversion.multipliercu === undefined) {
            return { met: 0, unit: '' }; // TODO
        }
        met = roundMaybeNicely(imp * conversion.multipliercu, forceRounding, useRounding);
        unit = 'L';
        suffix = '';
    } else {
        met = roundMaybeNicely(imp * multiplier, forceRounding, useRounding);
        let r = stepUpOrDown(met, unit, useMM, useGiga);

        met = roundNicely(r.met, useRounding);
        unit = r.unit;
    }

    if (met === 100 && unit === 'cm' && useMM === false) {
        met = 1;
        unit = 'm';

    } else if (met === 1000 && unit === 'mm' && useMM === true) {
        met = 1;
        unit = 'm';
    }

    return { met, unit: unit + suffix };
}

// TODO: remove global variable
/** Configure global regex feetInchRegex depending on unofficial symbols should be supported for feet and inches
 *  @param {boolean} includeImproperSymbols} - Whether to support unofficial symbols for feet and inches
*/
function setIncludeImproperSymbols(includeImproperSymbols) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    if (includeImproperSymbols) {
        feetInchRegex = new RegExp(
            [
                '(?:',
                    '[°º]?', // optional degree marker, TODO: don't know why
                    // feet
                    '(?:',
                        '[ \u00A0]?', // optional separator
                        numberPattern,
                        '[\'’′]', // feet marker (NOTE: with improper symbols)
                        '[-− \u00A0]?', // optional separator
                    ')?',
                    // inches
                    numberPattern,
                    '[ \u00A0]?', // optional separator
                    '(?:"|″|”|“|’’|\'\'|′′)', // inches marker (NOTE: with improper symbols)
                ')',
                // NOTE: since we include quotes as symbols for inches, we need
                // to detect when they are used on their to open a quotation
                '|',
                '(["″”“\n])',
                // check for already present conversion to metric
                '(?!', // negative look-ahead
                        ' ', // non-optional space
                        '[(]',  // opening parenthesis
                        '[0-9]',  // some digit
                    '|',
                        ' ?', // optional space
                        '\u200B', // ZERO WIDTH SPACE
                        '\u3010', // 【 (LEFT BLACK LENTICULAR BRACKET)
                ')',
            ].join(''),
            'gi',
        );
    } else {
        feetInchRegex = new RegExp(
            [
                '(?:',
                    '[°º]?', // optional degree marker, TODO: don't know why
                    // feet
                    '(?:',
                        '[ \u00A0]?', // optional separator
                        numberPattern,
                        '[′]', // feet marker (NOTE: without improper symbols)
                        '[-− \u00A0]?', // optional separator
                    ')?',
                    // inches
                    numberPattern,
                    '[ \u00A0]?', // optional separator
                    '(?:″|′′)', // inches marker (NOTE: without improper symbols)
                ')',
                // NOTE: since we do not include double quotes as symbols for
                // inches, there is no need to check whether they are for a
                // quotation
                //
                // check for already present conversion to metric
                '(?!', // negative look-ahead
                        ' ', // non-optional space
                        '[(]',  // opening parenthesis
                        '[0-9]',  // some digit
                    '|',
                        ' ?', // optional space
                        '\u200B', // ZERO WIDTH SPACE
                        '\u3010', // 【 (LEFT BLACK LENTICULAR BRACKET)
                ')',
            ].join(''),
            'gi',
        );
    }

    if (includeImproperSymbols) {
        footConversion.regex = footRegexWithImproperSymbols;
    } else {
        footConversion.regex = footRegexWithoutImproperSymbols;
    }
}

/** Return whether myString contains a number
 *  @param {string} myString - The string to test
 *  @return {boolean} - True when myString contains a number; false otherwise
*/
function hasNumber(myString) {
    return /\d/.test(myString);
}

/** Return a new string where all occurrences of lengths in feet and inches (“1' 2"”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} includeImproperSymbols - Whether to use unofficial symbols for feet and inches
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric lengths
*/
function replaceFeetAndInchesSymbol(text, includeImproperSymbols, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: part of the logic is dedicated to detecting things of the form
    // '"they were 3"' to avoid parsing '3"' as 3 inches
    let lastQuoteOpen = false;
    let match;
    while ((match = feetInchRegex.exec(text)) !== null) {
        if (includeImproperSymbols) {
            if (lastQuoteOpen) {
                lastQuoteOpen = false;
                continue;
            }
            if (match[3] === '\n') {
                lastQuoteOpen = false; //new line, ignore
                continue;
            }
            if (!hasNumber(match[0]) && !/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g.test(match[0])) {
                lastQuoteOpen = !lastQuoteOpen;
                continue;
            }
        }

        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        if (/[°º]/.test(match[0].charAt(0))) {
            continue;
        }
        if (/[a-wy-z]/i.test(match[0].charAt(0))) {
            lastQuoteOpen = !lastQuoteOpen;
            continue;
        }

        const feetStr = match[1];
        const inchStr = match[2];
        if (!feetStr && !inchStr) {
            continue;
        }

        const feet = parseNumber(feetStr || '0');
        if (feet === null) {
            continue;
        }

        const inches = parseNumber(inchStr || '0');
        if (inches === null) {
            continue;
        }

        // convert to m when over 3 feet, to cm (or mm) otherwise
        const ret = (
            feet.value + inches.value / 12 > 3
            ? applyConversion(feet.value + inches.value / 12, footConversion, '', isUK, useMM, useGiga, useRounding)
            : applyConversion(feet.value * 12 + inches.value, inchConversion, '', isUK, useMM, useGiga, useRounding)
        );

        const met = formatNumber(ret.met, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(met, ret.unit, useBold, useBrackets);

        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

// NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
const replacePoundsAndOuncesRegex = new RegExp(
    [
        '([0-9]{0,3})', // number
        '.?', // separator
        '(?:lbs?)', // pounds unit
        '.?', // separator
        '([0-9]+(\\.[0-9]+)?)', // number
        '.?', // separator
        'oz', // ounces unit
    ].join(''),
    'g',
);

/** Return a new string where all occurrences of weights (“1 lb 2 oz”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric weights
*/
function replacePoundsAndOunces(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = replacePoundsAndOuncesRegex.exec(text)) !== null) {
        const poundsPart = match[1];
        const ouncesPart = match[2];
        if (!poundsPart || !ouncesPart) {
            continue;
        }
        const pounds = parseFloat(poundsPart);
        const ounces = parseFloat(ouncesPart);
        const total = pounds * 16 + ounces;
        const formattedTotal = formatNumber(roundNicely(total * 0.0283495, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(formattedTotal, 'kg', useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

const replaceMilesPerGallonRegex = new RegExp(regstart + numberPattern + '[ \u00A0]?mpgs?' + unitSuffix, 'ig');

/** Return a new string where all occurrences of miles-per-gallon (“12 mpg”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric equivalent to mpg
*/
function replaceMilesPerGallon(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = replaceMilesPerGallonRegex.exec(text)) !== null) {
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        let impPart = match[1];
        if (!impPart) {
            continue;
        }
        impPart = impPart.replace(',', '');

        const imp = parseFloat(impPart);
        const l = 235.214583 / imp; // 100 * 3.785411784 / 1.609344 * imp;
        const met = roundNicely(l, useRounding);
        const formattedMet = formatNumber(met, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);

        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        const metStr = formatConvertedValue(formattedMet, 'L/100 km', useBold, useBrackets);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

// NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
const replaceIkeaSurfaceRegex = new RegExp(
    [
        // NOTE: Firefox now supports negative look-behinds, so this version might be usable
        // check that this is not preceded by a fraction bar
        (
            false
            ? '(?<!/)' // with look-behind
            : '/?' // manually, TODO: it looks like the check is not done at all
        ),
        numberPattern,
        ' ?', // optional space
        '[x*×]', // multiplication sign
        ' ?', // optional space
        numberPattern,
        ' ?', // optional space
        '(?:"|″|”|“|’’|\'\'|′′)', // inches marker
        '(?:[^a-z]|$)', // look for a separator
    ].join(''),
    'ig',
);

/** Return a new string where all occurrences of surfaces in the US Ikea format has been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric surfaces
*/
function replaceIkeaSurface(text, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = replaceIkeaSurfaceRegex.exec(text)) !== null) {
        const number1 = match[1];
        const number2 = match[2];
        if (number1 === undefined || number2 === undefined) {
            continue;
        }

        let inches1 = parseNumber(number1);
        if (inches1 === null) {
            continue;
        }

        let inches2 = parseNumber(number2);
        if (inches2 === null) {
            continue;
        }

        let scale = 2.54;
        let unit = 'cm';
        if (useMM === true) {
            scale = 25.4;
            unit = 'mm';
        }

        const cm1 = formatNumber(roundNicely(inches1.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(inches2.value * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Apply the transformation in a text for a given match
 *  @param {string} text - The original text
 *  @param {RegExpMatchArray} match - The match
 *  @param {import("./types").Conversion} conversion - The object describing the conversion
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric units
*/
function replaceOtherUnit(text, match, conversion, matchIn, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    const fullmatch = match[0];

    const impStr = match[1];
    if (impStr === undefined) {
        return text;
    }

    if (conversion == inchConversion) {
        if (/^[a-z#$€£]/i.test(fullmatch)) {
            return text;
        }
        if (!matchIn && / in /i.test(fullmatch))  { // “born in 1948 in …”
            return text;
        }
    }

    const parsed = parseNumber(impStr);
    if (parsed === null) {
        return text;
    }
    const imp = parsed.value;

    if (conversion == inchConversion && / in /i.test(fullmatch) && imp > 1000) {
        return text; // prevents converting “1960 in Germany”
    }

    const squareCubePrefix = match[2];
    let suffix = '';
    if (/²/.test(fullmatch)) {
        suffix = '²';
    } else if (/³/.test(fullmatch)) {
        suffix = '³';
    } else  if (squareCubePrefix !== undefined && /sq/i.test(squareCubePrefix)) {
        suffix = '²';
    } else if (squareCubePrefix !== undefined && /cu/i.test(squareCubePrefix)) {
        suffix = '³';
    }

    const ret = applyConversion(imp, conversion, suffix, isUK, useMM, useGiga, useRounding);
    const met = formatNumber(ret.met, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
    const metStr = formatConvertedValue(met, ret.unit, useBold, useBrackets);

    const insertIndex = (match.index || 0) + convertedValueInsertionOffset(fullmatch);
    return insertAt(text, metStr, insertIndex);
}

/** Return a new string where all occurrences of other non-metric units have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertTablespoon - Whether to convert tablespoons
 *  @param {boolean} convertTeaspoon - Whether to convert teaspoons
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric units
*/
function replaceOtherUnits(text, convertTablespoon, convertTeaspoon, degWithoutFahrenheit, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    let match;
    while ((match = getOtherUnitsRegex().exec(text)) !== null) {
        const fullmatch = match[0];
        if (!shouldConvert(fullmatch, convertBracketed)) {
            continue;
        }

        const unit = match[3];
        if (unit === undefined) {
            continue;
        }
        if (convertTablespoon && unitsTablespoon.regex !== undefined && unitsTablespoon.regex.test(unit)) {
            text = replaceOtherUnit(text, match, unitsTablespoon, matchIn, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
            continue;
        }
        if (convertTeaspoon && unitsTeaspoon.regex !== undefined && unitsTeaspoon.regex.test(unit)) {
            text = replaceOtherUnit(text, match, unitsTeaspoon, matchIn, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
            continue;
        }
        for (const conversion of conversions) {
            if (conversion.regex !== undefined && conversion.regex.test(unit)) {
                text = replaceOtherUnit(text, match, conversion, matchIn, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
                break;
            }
        }
    }

    return text;
}

/** Return a new string where non-metric units has been replaced with metric units
 *  @param {string} text - The original text
 *  @param {boolean} convertTablespoon - Whether to convert tablespoons
 *  @param {boolean} convertTeaspoon - Whether to convert teaspoons
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} includeImproperSymbols} - Whether to support unofficial symbols for feet and inches
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} includeQuotes - Whether single and double quotes should be interpreted as feet and inches
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @return {string} - A new string with metric units
*/
function replaceAll(text, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator) {
    text = replaceIkeaSurface(text, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    if (includeQuotes)
        text = replaceFeetAndInchesSymbol(text, includeImproperSymbols, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceVolume(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceSurfaceInInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceSurfaceInFeet(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceFeetAndInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replacePoundsAndOunces(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceOtherUnits(text, convertTablespoon, convertTeaspoon, degWithoutFahrenheit, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceMilesPerGallon(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceFahrenheit(text, degWithoutFahrenheit, convertBracketed, useKelvin, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    return text;
}

/** @type{ number | undefined } */
var lastquantity = undefined;
var skips = 0;
var foundDegreeSymbol = false;

/** Reset the global state associated with block processing
*/
function resetBlockProcessing() {
    lastquantity = undefined;
    skips = 0;
    foundDegreeSymbol = false;
}


/** Replace non-metric units with metric units and handle cross-node cases
 *  @param {string} text - The original text
 *  @param {boolean} convertTablespoon - Whether to convert tablespoons
 *  @param {boolean} convertTeaspoon - Whether to convert teaspoons
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} includeImproperSymbols} - Whether to support unofficial symbols for feet and inches
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} includeQuotes - Whether single and double quotes should be interpreted as feet and inches
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useComma - Whether to use a comma as decimal separator
 *  @param {boolean} useSpaces - Whether to use spaces as thousand separator
 *  @return {string} - A new string with metric units
*/
function processTextBlock(text, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useComma, useSpaces) {
    if (text.startsWith('{') || text.length < 1) {
        return text;
    }

    // skipping added for quantity and unit in separate blocks - after the number is found, sometimes next node is just a bunch of whitespace, like in cooking.nytimes, so we try again on the next node

    if (lastquantity !== undefined && skips < 2) {
        text = parseUnitOnly(text, degWithoutFahrenheit, isUK, useMM, useGiga, useKelvin, useRounding, useComma, useSpaces, useBold, useBrackets);
        if (/^[a-zA-Z°º]+$/g.test(text)) {
            lastquantity = undefined;
        }
        else {
            skips++;
            if (/[°º]/g.test(text)) {
                foundDegreeSymbol=true;
            } else {
                foundDegreeSymbol=false;
            }
        }
    } else if (text.length < 50) {
        const parsed = parseNumber(text);
        lastquantity = parsed  === null ? undefined : parsed.value;
        skips = 0;
    } else {
        lastquantity = undefined;
    }

    if ((lastquantity !== undefined && skips <= 2) || /[1-9¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g.test(text)) {
        text = replaceAll(text, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useComma, useSpaces);
    }

    return text;
}

/** Parse a non-metric unit, using lastquantity as the value
 *  @param {string} text - The string containing the unit
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useComma - Whether to use a comma as decimal separator
 *  @param {boolean} useSpaces - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string where the unit has been converted to metric
*/
function parseUnitOnly(text, degWithoutFahrenheit, isUK, useMM, useGiga, useKelvin, useRounding, useComma, useSpaces, useBold, useBrackets) {
    if (lastquantity === undefined) {
        return text;
    }

    if (degWithoutFahrenheit) {
        fahrenheitConversion.regexUnit = new RegExp(skipempty + '((°|º|deg(rees)?)[ \u00A0]?(F(ahrenheits?)?)?|[\u2109])' + skipbrackets + regend, 'ig');
    } else {
        fahrenheitConversion.regexUnit = new RegExp(skipempty + '((°|º|deg(rees)?)[ \u00A0]?F(ahrenheits?)?|[\u2109])' + skipbrackets + regend, 'ig');
    }

    //console.log("now trying " + text);
    for (const conversion of conversions) {
        if (conversion.regexUnit === undefined) {
            continue;
        }
        let match;
        while ((match = conversion.regexUnit.exec(text)) !== null) {
            const ret = applyConversion(lastquantity, conversion, "", isUK, useMM, useGiga, useRounding);
            const met = formatNumber(ret.met, useComma, useSpaces);
            const metStr = formatConvertedValue(met, ret.unit, useBold, useBrackets);
            const fullMatch = match[0];
            const insertIndex = match.index + convertedValueInsertionOffset(fullMatch);
            text = insertAt(text, metStr, insertIndex);
        }

    }

    if (foundDegreeSymbol) {
        if (text.charAt(0) !== 'F') {
            return text;
        }

        if (text.length>=3 && /^F\u200B\u3010|^F[\(][0-9]/.test(text)) {
            return text; //it has been already converted
        }

        let met = fahrenheitToMetric(lastquantity, useKelvin, useRounding);
        let unit = '°C';
        if (useKelvin) {
            met += 273.15;
            unit = 'K';
            met = roundNicely(met, useRounding);
        }

        const formatted = formatNumber(met, useComma, useSpaces);
        const metStr = formatConvertedValue(formatted, unit, useBold, useBrackets);
        text = insertAt(text, metStr, 1);
    }
    return text;
}

/** Returns a translation table for String.translate()
 *
 * Similar to Python's maketrans() https://docs.python.org/3/library/stdtypes.html#str.maketrans
 *
 *  @param {string} fromCharset - Whether to convert tablespoons
 *  @param {string} toCharset - Whether to convert teaspoons
 *  @param {string} [removeCharset] - Whether to convert teaspoons
 *  @return {import("./types").TranslationTable} - The object to pass to String.translate
*/
function maketrans(fromCharset, toCharset, removeCharset) {
    if (fromCharset.length != toCharset.length) {
        throw Error('the first two maketrans arguments must have equal length');
    }

    /** @type{ { [key: string]: string } } */
    const characterMap = {};
    // NOTE: there is no enumerate() equivalent for strings in JavaScript
    for (let i = 0; i < fromCharset.length; i++) {
        const f = fromCharset[i];
        const t = toCharset[i];
        if (f === undefined || t === undefined) {
            continue;
        }
        characterMap[f] = t;
    }
    const charactersToMatch = removeCharset ? fromCharset + removeCharset : fromCharset;
    const pattern = new RegExp('[' + charactersToMatch.replace('\\', '\\\\').replace('-', '\\-').replace(']', '\\]') + ']', 'g');
    return { pattern, characterMap };
}

/** Return a copy of the string in which each character has been mapped through the given translation table
 *
 *  @param {import("./types").TranslationTable} table - Object created by maketrans()
 *  @return {string} toCharset - Whether to convert teaspoons
*/
String.prototype.translate = function(table) {
    const { pattern, characterMap } = table;
    return this.replace(pattern, c => characterMap[c] || '');
}

const numberTranslation = maketrans(
    '−÷∕⁄',
    '-///',
);

const parseNumberRegex = new RegExp(
    [
        '^',
        // main number
        '([+\\-]?[0-9,  \\.e]+?)?',
        '(?:\\s*|-)',
        // fraction
        '(?:',
            // Unicode fraction
                '([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])',
            '|',
            // ASCII fraction
                '([0-9]+\\s*/\\s*[0-9]+)',
        ')?',
        '$',
    ].join(''),
);

/** Parse a number, and count the number of significant digits
 *  @param {string} number - The number to parse as a string
 *  @return {import("./types").ValueWithSignificantDigits | null} - The evaluated number, along with the number of significant digits
*/
function parseNumber(number) {
    // check that the string contains at least one Number code-point (e.g. 1, １, ½)
    if (!/\p{Number}/u.test(number)) {
        return null;
    }

    // NOTE: ideally, we would want to use the Unicode numeric value associated
    // with each character in number. But, of course, JavaScript does not
    // expose this. So, instead, we just support a small character set by hand
    const mostlyAsciiNumber = number.translate(numberTranslation);

    const match = mostlyAsciiNumber.match(parseNumberRegex);
    if (!match) {
        return null;
    }

    let value = 0;
    let significantFigures = 0;

    // NOTE: parseFloat matches as many characters as possible, and ignore
    // invalid ones, so it does not detect invalid numbers. We use Number().

    const simpleNumber = match[1];
    if (simpleNumber !== undefined) {
        const withoutGroups = simpleNumber.replace(/[,  ]/g, '');
        const partialValue = Number(withoutGroups);
        if (!isFinite(partialValue)) {
            return null;
        }
        value += partialValue;
        significantFigures = partialValue.toExponential().replace(/^-?0*|\.|0*e.*/g, '').length;
    }

    // Note: NFKD normalization would allow us to expand Unicode fractions,
    // but '3½' would end up as “31/2”, so we're doing it manually
    const unicodeFraction = match[2];
    if (unicodeFraction !== undefined) {
        const partialValue = fractions[unicodeFraction];
        if (partialValue === undefined || !isFinite(partialValue)) {
            return null;
        }
        value += partialValue;
        significantFigures = 0;
    }

    const asciiFraction = match[3];
    if (asciiFraction !== undefined) {
        const [numerator, denominator] = asciiFraction.replace(' ', '').split('/');
        const partialValue = Number(numerator) / Number(denominator);
        if (!isFinite(partialValue)) {
            return null;
        }
        value += partialValue;
        significantFigures = 0;
    }

    return { value, significantFigures };
}

module.exports = { fahrenheitConversion, inchConversion, conversions, stepUpOrDown, insertAt, shouldConvert, fahrenheitToMetric, roundNicely, formatNumber, convertedValueInsertionOffset, bold, formatConvertedValue, parseNumber, replaceFahrenheit, replaceVolume, replaceSurfaceInInches, replaceSurfaceInFeet, replaceFeetAndInches, applyConversion, setIncludeImproperSymbols, replaceFeetAndInchesSymbol, replacePoundsAndOunces, replaceMilesPerGallon, replaceIkeaSurface, replaceOtherUnits, replaceAll, processTextBlock, maketrans, resetBlockProcessing };
