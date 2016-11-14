'use strict';

const Fs = require('fs');
const OS = require('os');
const Path = require('path');
const ChildProcess = require('child_process');

const platform = OS.platform();

const re = {
    slash: /\\/g,
    split: /[\/\\]/g
};

/**
 * @class FileAccess
 * This class contains useful boolean properties that categories file access. This makes
 * for shorter code then use of `fs.constants.R_OK` and related masks.
 *
 *      // path is a string path
 *
 *      let mode = fs.statSync(path).mode;
 *
 *      if (mode & fs.constants.R_OK && mode & fs.constants.W_OK) {
 *          // path is R and W
 *      }
 *      // else path is missing R and/or W
 *
 *      // or
 *
 *      try {
 *          fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
 *
 *          // path is R and W
 *      }
 *      catch (e) {
 *          // path is missing R and/or W
 *      }
 *
 * Or using `File`:
 *
 *      // file is a File instance
 *
 *      if (file.access().rw) {
 *          // file is R and W
 *      }
 *      // else file is missing R and/or W
 *
 * Or:
 *
 *      // file is a File instance
 *
 *      if (file.can('rw')) {
 *          // file is R and W
 *      }
 *      // else file is missing R and/or W
 */

/**
 * @property {Number} mask
 * @readonly
 * This property holds the bit-wise OR of the available access modes `fs.constants.R_OK`,
 *  `fs.constants.W_OK` and/or  `fs.constants.X_OK`.
 */
/**
 * @property {"r"/"rw"/"rwx"/"w"/"wx"/"x"} name
 * @readonly
 * This string holds the available access modes as single letters.
 */
/**
 * @property {Boolean} r
 * @readonly
 * This property is `true` if the file can be read.
 */
/**
 * @property {Boolean} rw
 * @readonly
 * This property is `true` if the file can be read and written.
 */
/**
 * @property {Boolean} rx
 * @readonly
 * This property is `true` if the file can be read and executed.
 */
/**
 * @property {Boolean} rwx
 * @readonly
 * This property is `true` if the file can be read, written and executed.
 */
/**
 * @property {Boolean} w
 * @readonly
 * This property is `true` if the file can be written.
 */
/**
 * @property {Boolean} wx
 * @readonly
 * This property is `true` if the file can be written and executed.
 */
/**
 * @property {Boolean} x
 * @readonly
 * This property is `true` if the file can be executed.
 */

//================================================================================

/**
 * This class wraps a path to a file or directory and provides methods to ease processing
 * and operating on that path.
 *
 * ## Naming Conventions
 *
 * Since it can be confusing when a string is returned or a `File` instance, a naming
 * convention is used throughout. Any method that ends with "Path" returns a string,
 * while all other methods return a `File`. Methods often come in pairs: one that returns
 * the string form and one that returns a `File`. In general, it is safest/best to stay
 * in the realm of `File` objects so their names are more concise.
 *
 *      var absFile = file.absolutify();  // a File object
 *
 *      var absPath = file.absolutePath(); // a string
 *
 * ### Synchronous vs Asynchronous
 *
 * All async methods return promises and have names that look like `asyncFoo()`. For
 * example, the `stat` method is synchronous while the asynchronous version is
 * `asyncStat`.
 *
 *      var st = file.stat();  // sync
 *
 *      file.asyncStat().then(st => {
 *          // async
 *      });
 */
class File {
    /**
     * Returns the `FileAccess` object describing the access modes available for the
     * specified file. This will be `null` if the file does not exist.
     *
     * @param {String/File} file The `File` instance of path as a string.
     * @return {FileAccess}
     */
    static access (file) {
        if (!file) {
            return null;
        }

        return File.from(file).access();
    }

    /**
     * Returns the `process.cwd()` as a `File` instance.
     * @return {File} The `process.cwd()` as a `File` instance.
     */
    static cwd () {
        return new File(process.cwd());
    }

    /**
     * Returns `true` if the specified file exists, `false` if not.
     * @param {String/File} file The `File` or path to test for existence.
     * @return {Boolean} `true` if the file exists.
     */
    static exists (file) {
        if (!file) {
            return false;
        }

        return File.from(file).exists();
    }

    /**
     * Returns a `File` for the specified path (if it is not already a `File`).
     * @param {String/File} path The `File` or path to convert to a `File`.
     * @return {File} The `File` instance.
     */
    static from (path) {
        var file = path || null;

        if (file && !file.$isFile) {
            file = new File(path);
        }

        return file;
    }

    /**
     * Returns the `os.homedir()` as a `File` instance. On Windows, this is something
     * like `"C:\Users\Name"`.
     *
     * @return {File} The `os.homedir()` as a `File` instance.
     */
    static home () {
        return new File(OS.homedir());
    }

    /**
     * Returns `true` if the specified path is a directory, `false` if not.
     * @param {String/File} file The `File` or path to test.
     * @return {Boolean}
     */
    static isDir (file) {
        if (!file) {
            return false;
        }

        return File.from(file).isDir();
    }

    /**
     * Returns `true` if the specified path is a file, `false` if not.
     * @param {String/File} file The `File` or path to test.
     * @return {Boolean}
     */
    static isFile (file) {
        if (!file) {
            return false;
        }

        return File.from(file).isFile();
    }

    /**
     * This method is the same as `join()` in the `path` module except that the items
     * can be `File` instances or `String` and a `File` instance is returned.
     * @param {File/String...} parts Path pieces to join using `path.join()`.
     * @return {File}
     */
    static join (...parts) {
        var f = File.joinPath(...parts);
        return new File(f);
    }

    /**
     * This method is the same as `join()` in the `path` module except that the items
     * can be `File` instances or `String`.
     * @param {File/String...} parts Path pieces to join using `path.join()`.
     * @return {String}
     */
    static joinPath (...parts) {
        let n = parts && parts.length || 0;

        for (let i = 0; i < n; ++i) {
            let p = parts[i];

            if (p.$isFile) {
                parts[i] = p.path;
            }
        }

        let ret = (n === 1) ? parts[0] : (n && Path.join(...parts));

        return ret || '';
    }

    /**
     * Returns the path as a string given a `File` or string.
     * @param {String/File} file
     * @return {String}
     */
    static path (file) {
        return ((file && file.$isFile) ? file.path : file) || '';
    }

    /**
     * Returns the folder into which applications should save data for their users. For
     * example, on Windows this would be `"C:\Users\Name\AppData\Roaming\Company"` where
     * "Name" is the user's name and "Company" is the owner of the data (typically the
     * name of the company producing the application).
     *
     * This location is platform-specific:
     *
     *  - Windows:  C:\Users\Name\AppData\Roaming\Company
     *  - Mac OS X: /Users/Name/Library/Application Support/Company
     *  - Linux:    /home/name/.local/share/data/company
     *  - Default:  /home/name/.company
     *
     * The set of recognized platforms for profile locations is found in `profilers`.
     *
     * @param {String} company The name of the application's producer.
     * @return {File}
     */
    static profile (company) {
        company = company || File.COMPANY;

        if (!company) {
            throw new Error('Must provide company name to isolate profile data');
        }

        var fn = File.profilers[platform] || File.profilers.default;

        return fn(File.home(), company);
    }

    /**
     * This method is the same as `resolve()` in the `path` module except that the items
     * can be `File` instances or `String` and a `File` instance is returned.
     * @param {File/String...} parts Path pieces to resolve using `path.resolve()`.
     * @return {File}
     */
    static resolve (...parts) {
        var f = File.resolvePath(...parts);
        return new File(f);
    }

    /**
     * This method is the same as `resolve()` in the `path` module except that the items
     * can be `File` instances or `String`.
     * @param {File/String...} parts Path pieces to resolve using `path.resolve()`.
     * @return {String}
     */
    static resolvePath (...parts) {
        for (let i = 0, n = parts.length; i < n; ++i) {
            let p = parts[i];

            if (p.$isFile) {
                parts[i] = p.path;
            }
        }

        return (parts && parts.length && Path.resolve(...parts)) || '';
    }

    /**
     * Splits the given `File` or path into an array of parts.
     * @param {String/File} filePath
     * @return {String[]}
     */
    static split (filePath) {
        let path = File.path(filePath);
        return path.split(re.split);
    }

    //-----------------------------------------------------------------

    /**
     * Initialize an instance by joining the given path fragments.
     * @param {File/String...} parts
     */
    constructor (...parts) {
        this.path = File.joinPath(...parts);
    }

    //----------------------------
    // Properties

    /**
     * @property {String} name
     * @readonly
     * The name of the file at the end of the path. For example, given "/foo/bar/baz",
     * the `name` is "baz".
     */
    get name () {
        var name = this._name;

        if (name === undefined) {
            let index = this.lastSeparator();

            this._name = name = ((index > -1) && this.path.substr(index + 1)) || '';
        }

        return name;
    }

    /**
     * @property {File} parent
     * @readonly
     * The parent directory of this file. For example, for "/foo/bar/baz" the `parent` is
     * "/foo/bar". This is `null` for the file system root.
     */
    get parent () {
        var parent = this._parent;

        if (parent === undefined) {
            let path = this.path;
            let ret = Path.resolve(path, '..');

            if (path === ret) {
                ret = null;
            }

            this._parent = parent = ret && new File(ret);
        }

        return parent;
    }

    /**
     * @property {String} extent
     * @readonly
     * The type of the file at the end of the path. For example, given "/foo/bar/baz.js",
     * the `extent` is "js".
     */
    get extent () {
        var ext = this._extent;

        if (ext === undefined) {
            let name = this.name;
            let index = name.lastIndexOf('.');

            this._extent = ext = ((index > -1) && name.substr(index + 1)) || '';
        }

        return ext;
    }

    //-----------------------------------------------------------------
    // Path calculation

    absolutePath () {
        return Path.resolve(this.path);
    }

    absolutify () {
        return File.from(this.absolutePath());
    }

    canonicalPath () {
        return Fs.realpathSync(Path.resolve(this.path));
    }

    canonicalize () {
        return File.from(this.canonicalPath());
    }

    joinPath (...parts) {
        return File.joinPath(this, ...parts);
    }

    join (...parts) {
        return File.join(this, ...parts);
    }

    lastSeparator () {
        var path = this.path,
            i = path.lastIndexOf('/'),
            j = path.lastIndexOf('\\');

        return (i > j) ? i : j;
    }

    nativePath (separator) {
        var p = this.path;

        return p && p.replace(re.split, separator || File.separator);
    }

    nativize (separator) {
        return File.from(this.nativePath(separator));
    }

    normalize () {
        return File.from(this.normalizedPath());
    }

    normalizedPath () {
        var p = this.path;
        return p && Path.normalize(p);
    }

    relativePath (path) {
        if (path.$isFile) {
            path = path.getCanonicalPath();
        }

        let p = this.canonicalPath();

        return p && path && Path.relative(p, path);
    }

    relativize (path) {
        return File.from(this.relativePath(path));
    }

    resolvePath (...parts) {
        return File.resolvePath(this, ...parts);
    }

    resolve (...parts) {
        return File.resolve(this, ...parts);
    }

    slashifiedPath () {
        return this.path.replace(re.slash, '/');
    }

    /**
     * Replace forward/backward slashes with forward slashes.
     * @return {String}
     */
    slashify () {
        return File.from(this.slashifiedPath());
    }

    split () {
        return File.split(this);
    }

    toString () {
        return this.path;
    }

    terminatedPath (separator) {
        if (separator == null || separator === true) {
            separator = File.separator;
        }

        let p = this.path;

        if (p && p.length) {
            let n = p.length - 1;
            let c = p[n];

            if (separator) {
                if (c !== separator) {
                    p += separator;
                }
            }
            else {
                while (n >= 0 && (c === '/' || c === '\\')) {
                    p = p.substr(0, n--);
                    c = p[n];
                }
            }
        }

        return p || '';
    }

    terminate (separator) {
        return File.from(this.terminatedPath(separator));
    }

    unterminatedPath () {
        return this.terminatedPath(false);
    }

    unterminate () {
        return File.from(this.unterminatedPath());
    }

    //-----------------------------------------------------------------
    // Path checks

    contains (subPath) {
        subPath = File.from(subPath);

        if (subPath) {
            // Ensure we don't have trailing slashes ("/foo/bar/" => "/foo/bar")
            let a = this.slashify().unterminatedPath();
            let b = subPath.slashifiedPath();

            if (a.startsWith(b)) {
                // a = "/foo/bar"
                // b = "/foo/bar/zip" ==> true
                // b = "/foo/barf"    ==> false
                return b[a.length] === '/';
            }
        }

        return false;
    }

    equals (other) {
        other = File.from(other);

        // Treat "/foo/bar" and "/foo/bar/" as equal (by stripping trailing delimiters)
        let a = this.unterminatedPath();
        let b = other && other.unterminatedPath() || '';

        // If the platform has case-insensitive file names, ignore case...
        if (!File.CASE) {
            a = a.toLowerCase();
            b = b.toLowerCase();
        }

        return a === b;
    }

    isAbsolute () {
        var p = this.path;
        return p ? Path.isAbsolute(p) : false;
    }

    isRelative () {
        var p = this.path;
        return p ? !Path.isAbsolute(p) : false;
    }

    //-----------------------------------------------------------------
    // File system checks

    /**
     * Returns a `FileAccess` object describing the access available for this file. If the
     * file does not exist, `null` is returned.
     *
     *      var acc = File.from(s).access();
     *
     *      if (!acc) {
     *          // no file ...
     *      }
     *      else if (acc.rw) {
     *          // file at location s has R and W permission
     *      }
     *
     * Alternatively:
     *
     *      if (File.from(s).can('rw')) {
     *          // file at location s has R and W permission
     *      }
     *
     * @param {Boolean} [strict] Pass `true` to throw exceptions on failure.
     * @return {FileAccess}
     */
    access (strict) {
        var st = this.stat(strict);

        if (st === null) {
            return null;
        }

        let mask = st.mode & File.RWX.mask;
        return ACCESS[mask] || null;
    }

    /**
     * Returns `true` if the desired access is available for this file.
     * @param {"r"/"rw"/"rx"/"rwx"/"w"/"wx"/"x"} mode
     * @return {Boolean}
     */
    can (mode) {
        var acc = this.access();

        return acc ? acc[mode] : false;
    }

    /**
     * Returns `true` if this file exists, `false` if not.
     * @return {Boolean}
     */
    exists () {
        var st = this.stat();
        return st !== null;
    }

    /**
     * Returns `true` if the specified path exists relative to this path.
     * @param {String} rel A path relative to this path.
     * @return {Boolean}
     */
    has (rel) {
        var f = this.resolve(rel);
        return f.exists();
    }

    /**
     * Returns `true` if the specified directory exists relative to this path.
     * @param {String} rel A path relative to this path.
     * @return {Boolean}
     */
    hasDir (rel) {
        var f = this.resolve(rel);

        return f.isDir();
    }

    /**
     * Returns `true` if the specified file exists relative to this path.
     * @param {String} rel A path relative to this path.
     * @return {Boolean}
     */
    hasFile (rel) {
        var f = this.join(rel);

        return f.isFile();
    }

    /**
     * Returns the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)` but
     * ensures a fresh copy of the stats are fetched from the file-system.
     *
     * @param {Boolean} [cache] Pass `true` to retain a cached stat object after this
     * call.
     * @param {Boolean} [strict] Pass `true` to throw exceptions on failure.
     * @return {fs.Stats}
     */
    restat (cache, strict) {
        this._stat = null;

        let ret = this.stat(strict);

        if (cache) {
            this._stat = ret;
        }

        return ret;
    }

    /**
     * Return the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)` for a
     * (potentially) symbolic link but ensures a fresh copy of the stats are fetched
     * from the file-system.
     *
     * @param {Boolean} [cache] Pass `true` to retain a cached stat object after this
     * call.
     * @param {Boolean} [strict] Pass `true` to throw exceptions on failure.
     * @return {fs.Stats}
     */
    restatLink (cache, strict) {
        this._stat = null;

        let ret = this.statLink(strict);

        if (cache) {
            this._stat = ret;
        }

        return ret;
    }

    /**
     * Return the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)`.
     *
     *      var st = File.from(s).stat();
     *
     *      if (st) {
     *          // file exists...
     *      }
     *
     * In cases where details of the failure are desired, pass `true` to enable `strict`
     * processing:
     *
     *      var st = File.from(s).stat(true);
     *
     *      // will throw if file does not exist or is inaccessible, etc..
     *
     * Note that in some cases (e.g., a directory listing created the instance), a stat
     * object may be cached on this instance. If so, that object will always be returned.
     * Use `restat` to ensure a fresh stat from the file-system.
     *
     * @param {Boolean} [strict] Pass `true` to throw exceptions on failure.
     * @return {fs.Stats} The stats or `null` if the file does not exist.
     */
    stat (strict) {
        let ret = this._stat;

        if (!ret) {
            // if (File.WIN) {
            //     return Win.dir(this.path).then(stats => {
            //         console.log('stats:', stats);
            //         return stats[0];
            //     });
            // }

            if (strict) {
                ret = Fs.statSync(this.path);
            }
            else {
                try {
                    ret = Fs.statSync(this.path);
                }
                catch (e) {
                    // ignore
                }
            }
        }

        return ret;
    }

    /**
     * Return the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)` for a
     * (potentially) symbolic link.
     *
     * Note that in some cases (e.g., a directory listing created the instance), a stat
     * object may be cached on this instance. If so, that object will always be returned.
     * Use `restatLink` to ensure a fresh stat from the file-system.
     *
     * @param {Boolean} [strict] Pass `true` to throw exceptions on failure.
     * @return {fs.Stats} The stats or `null` if the file does not exist.
     */
    statLink (strict) {
        let ret = this._stat;

        if (!ret) {
            // if (File.WIN) {
            //     return Win.dir(this.path).then(stats => {
            //         console.log('stats:', stats);
            //         return stats[0];
            //     });
            // }

            if (strict) {
                ret = Fs.lstatSync(this.path);
            }
            else {
                try {
                    ret = Fs.lstatSync(this.path);
                }
                catch (e) {
                    // ignore
                }
            }
        }

        return ret;
    }

    /**
     * Searches for a parent folder that matches the given `test`.
     *
     *      // climb until a parent has a ".git" item (file or folder)
     *      f = file.up('.git');
     *
     *      // Climb until a parent has a ".git" sub-folder.
     *      f = file.up(p => p.join('.git').isDirectory());
     *
     * The above is equivalent to:
     *
     *      f = file.upDir('.git');
     *
     * If the current folder could match, `where` is a better choice. This is because `up`
     * will always skip the current folder.
     *
     * @param {String/Function} test If a string is passed, the string is passed to the
     * `has` method. Otherwise, the `test` function is called with the candidate parent
     * and should return `true` to indicate the parent is a match.
     * @return {File}
     */
    up (test) {
        let p = this.parent;

        if (p && test) {
            p = p.where(test);
        }

        return p;
    }

    /**
     * Searches for a parent folder that has the specified sub-directory.
     *
     *      f = file.upDir('.git');
     *
     * If the current folder could match, `whereDir` is a better choice. This is because
     * `upDir` will always skip the current folder.
     *
     * @param {String} sub The sub-directory that the desired parent must contain.
     * @return {File}
     */
    upDir (sub) {
        return this.up(parent => parent.hasDir(sub));
    }

    /**
     * Searches for a parent folder that has the specified file.
     *
     *      f = file.upFile('package.json');
     *
     * If the current folder could match, `whereFile` is a better choice. This is because
     * `upFile` will always skip the current folder.
     *
     * @param {String} file The file that the desired parent must contain.
     * @return {File}
     */
    upFile (file) {
        return this.up(parent => parent.hasFile(file));
    }

    /**
     * Starting at this location, searches for a location that passes the provided `test`
     * function. If `test` is a string, it will match any item (file or folder).
     *
     *      // climb until a folder has a ".git" item (file or folder)
     *      f = file.where('.git');
     *
     *      // Climb until a folder has a ".git" sub-folder.
     *      f = file.where(p => p.join('.git').isDirectory());
     *
     * The above is equivalent to:
     *
     *      f = file.whereDir('.git');
     *
     * Unlike the `up` family, the `where` family can match the location described by this
     * file.
     *
     * @param {String/Function} test If a string is passed, the string is passed to the
     * `has` method. Otherwise, the `test` function is called with the candidate and
     * should return `true` to indicate a match.
     * @return {File}
     */
    where (test) {
        let test = (typeof test === 'string') ? (p => p.has(test)) : test;

        for (let parent = this; parent; parent = parent.parent) {
            if (test(parent)) {
                return parent;
            }
        }

        return null;
    }

    /**
     * Searches for a folder that has the specified sub-directory.
     *
     *      f = file.whereDir('.git');
     *
     * Unlike the `up` family, the `where` family can match the location described by this
     * file.
     *
     * @param {String} sub The sub-directory that the desired parent must contain.
     * @return {File}
     */
    whereDir (sub) {
        return this.where(parent => parent.hasDir(sub));
    }

    /**
     * Searches for a folder that has the specified file.
     *
     *      f = file.whereFile('package.json');
     *
     * Unlike the `up` family, the `where` family can match the location described by this
     * file.
     *
     * @param {String} file The file that the desired parent must contain.
     * @return {File}
     */
    whereFile (sub) {
        return this.where(parent => parent.hasFile(sub));
    }

    //------------------------------------------------------------------
    // File system checks (async)

    /**
     * Returns a `FileAccess` object describing the access available for this file. If the
     * file does not exist, `null` is returned.
     *
     *      File.from(s).asyncAccess().then(acc => {
     *          if (!acc) {
     *              // no file ...
     *          }
     *          else if (acc.rw) {
     *              // file at location s has R and W permission
     *          }
     *      });
     *
     * Alternatively:
     *
     *      File.from(s).asyncCan('rw').then(can => {
     *          if (can) {
     *              // file at location s has R and W permission
     *          }
     *      });
     *
     * @param {Boolean} [strict] Pass `true` to throw exceptions on failure.
     * @return {Promise}
     */
    asyncAccess (strict) {
        return this.asyncStat(strict).then(st => {
            if (st === null) {
                return null;
            }

            let mask = st.mode & File.RWX.mask;
            return ACCESS[mask];
        });
    }

    asyncCan (mode) {
        return this.asyncAccess().then(acc => {
            if (acc === null) {
                return false;
            }

            return acc[mode] || false;
        });
    }

    asyncExists () {
        return this.asyncStat().then(st => {
            return st !== null;
        });
    }

    /**
     * Returns the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)` but
     * ensures a fresh copy of the stats are fetched from the file-system.
     *
     * @param {Boolean} [cache] Pass `true` to retain a cached stat object after this
     * call.
     * @param {Boolean} [strict] Pass `true` to reject on failure.
     * @return {Promise<fs.Stats>} The stats or `null` if the file does not exist.
     */
    asyncRestat (cache, strict) {
        this._stat = null;

        let ret = this.asyncStat(strict);

        if (cache) {
            ret = ret.then(st => {
                return this._stat = st;
            });
        }

        return ret;
    }

    /**
     * Return the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)` for a
     * (potentially) symbolic link but ensures a fresh copy of the stats are fetched
     * from the file-system.
     *
     * @param {Boolean} [cache] Pass `true` to retain a cached stat object after this
     * call.
     * @param {Boolean} [strict] Pass `true` to throw exceptions on failure.
     * @return {Promise<fs.Stats>} The stats or `null` if the file does not exist.
     */
    asyncRestatLink (cache, strict) {
        this._stat = null;

        let ret = this.asyncStatLink(strict);

        if (cache) {
            ret = ret.then(st => {
                return this._stat = st;
            });
        }

        return ret;
    }

    /**
     * Return the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)`.
     *
     *      File.from(s).asyncStat().then(st => {
     *          if (st) {
     *              // file exists...
     *          }
     *      });
     *
     * In cases where details of the failure are desired, pass `true` to enable `strict`
     * processing:
     *
     *      File.from(s).asyncStat(true).then(st => {
     *          // file exists...
     *      },
     *      err => {
     *          // file does not exist or is inaccessible, etc..
     *      });
     *
     * Note that in some cases (e.g., a directory listing created the instance), a stat
     * object may be cached on this instance. If so, that object will always be returned.
     * Use `asyncRestat` to ensure a fresh stat from the file-system.
     *
     * @param {Boolean} [strict] Pass `true` to reject on failure.
     * @return {Promise<fs.Stats>} The stats or `null` if the file does not exist.
     */
    asyncStat (strict) {
        if (this._stat) {
            return Promise.resolve(this._stat);
        }

        // if (File.WIN) {
        //     return Win.dir(this.path).then(stats => {
        //         console.log('stats:', stats);
        //         return stats[0];
        //     });
        // }

        return new Promise((resolve, reject) => {
            Fs.stat(this.path, (err, stats) => {
                if (!err) {
                    resolve(stats);
                }
                else if (strict) {
                    reject(err);
                }
                else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Return the `[fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)` for a
     * (potentially) symbolic link.
     *
     *      File.from(s).asyncStatLink().then(st => {
     *          if (st) {
     *              // file exists...
     *          }
     *      });
     *
     * Note that in some cases (e.g., a directory listing created the instance), a stat
     * object may be cached on this instance. If so, that object will always be returned.
     * Use `asyncRestatLink` to ensure a fresh stat from the file-system.
     *
     * @param {Boolean} [strict] Pass `true` to reject on failure.
     * @return {Promise<fs.Stats>} The stats or `null` if the file does not exist.
     */
    asyncStatLink (strict) {
        if (this._stat) {
            return Promise.resolve(this._stat);
        }

        // if (File.WIN) {
        //     return Win.dir(this.path).then(stats => {
        //         console.log('stats:', stats);
        //         return stats[0];
        //     });
        // }

        return new Promise((resolve, reject) => {
            Fs.lstat(this.path, (err, stats) => {
                if (!err) {
                    resolve(stats);
                }
                else if (strict) {
                    reject(err);
                }
                else {
                    resolve(null);
                }
            });
        });
    }

    //-----------------------------------------------------------------
    // File I/O

    asyncLoad (options) {
        let loader = this.getLoader(options);

        return loader.asyncLoad(this, options);
    }

    getLoader (options) {
        let loader;

        if (options) {
            if (options.type) {
                loader = File.loaders[options.type];
                if (!loader) {
                    throw new Error(`No such loader as "${options.type}"`);
                }
            }
        }

        if (!loader) {
            loader = File.loaders[this.extent] || File.loaders.text; // eg "json"
        }
    }

    load (options) {
        let loader = this.getLoader(options);

        return loader.load(this, options);
    }
}

File.Loader = class {
    constructor (config) {
        Object.assign(this, config);

        if (!this.options) {
            this.options = {};
        }
    }

    extend (config) {
        var loader = Object.create(this);

        if (config) {
            let options = config.options;

            Object.assign(loader, config);

            if (options) {
                loader.options = this.getOptions(options);
            }
        }

        return loader;
    }

    getOptions (options) {
        var ret = this.options;

        if (options) {
            ret = Object.assign(Object.assign({}, ret), options);
            delete ret.type;
        }

        return ret;
    }

    asyncLoad (filename, options) {
        options = this.getOptions(options);

        return this.asyncRead(filename, options).then(data => {
            return this.parse(data, options);
        });
    }

    asyncRead (filename, options) {
        return new Promise((resolve, reject) => {
            Fs.readFile(File.path(filename), options, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }

    load (filename, options) {
        options = this.getOptions(options);

        var data = this.read(filename, options);

        return this.parse(data, options);
    }

    parse (data) {
        var split = this.split;

        if (split) {
            data = data.split(split);
        }

        return data;
    }

    read (filename, options) {
        return Fs.readFileSync(File.path(filename), options);
    }
};

File.loaders = {
    binary: new File.Loader(),

    text: new File.Loader({
        options: {
            encoding: 'utf8'
        }
    })
};

File.loaders.bin = File.loaders.binary;
File.loaders.txt = File.loaders.text;

File.loaders.json = File.loaders.text.extend({
    parse (data) {
        return JSON.parse(data);
    }
});

const proto = File.prototype;

Object.assign(proto, {
    $isFile: true,
    _re: re,
    _stat: null,

    _extent: undefined,
    _name: undefined,
    _parent: undefined
});

File.WIN = /^win\d\d$/i.test(platform);
File.MAC = /^darwin$/i.test(platform);

File.CASE = !File.WIN && !File.MAC;

File.isDirectory = File.isDir;
File.re = re;
File.separator = Path.sep;

File.profilers = {
    default (home, company) {
        return home.join(`.${company.toLowerCase()}`);
    },

    darwin (home, company) {
        return home.join(`Library/Application Support/${company}`);
    },

    linux (home, company) {
        return home.join(`.local/share/data/${company.toLowerCase()}`);
    },

    win32 (home, company) {
        return File.join(process.env.APPDATA || process.env.LOCALAPPDATA ||
                         home.join('AppData\\Roaming'), `${company}`);

    }
};

//--------------------

const ACCESS = File.ACCESS = {
    rwx: {
        name: 'rwx',

        r: true,
        w: true,
        x: true,

        rw: true,
        rx: true,
        wx: true,

        rwx: true,

        mask: Fs.constants.R_OK | Fs.constants.W_OK | Fs.constants.X_OK
    }
};

ACCESS[ACCESS.rwx.mask] = ACCESS.RWX = File.RWX = ACCESS.rwx;

[Fs.constants.R_OK, Fs.constants.W_OK, Fs.constants.X_OK].forEach((mask, index, array) => {
    let c = 'rwx'[index];
    let obj = ACCESS[c] = ACCESS[c.toUpperCase()] = File[c.toUpperCase()] = {
        name: c,

        r: c === 'r',
        w: c === 'w',
        x: c === 'x',

        rw: false,
        rx: false,
        wx: false,

        rwx: false,

        mask: mask
    };

    ACCESS[obj.mask] = obj;
    Object.freeze(obj);

    for (let i = index + 1; i < array.length; ++i) {
        let c2 = 'rwx'[i];
        let key = c + c2; // rw, rx and wx
        let KEY = key.toUpperCase();
        let obj2 = ACCESS[key] = ACCESS[KEY] = File[KEY] = Object.assign({}, obj);

        obj2[c2] = obj2[key] = true;
        obj2.name = key;
        obj2.mask |= array[i];

        ACCESS[obj2.mask] = obj2;

        Object.freeze(obj2);
    }
});

Object.freeze(ACCESS.rwx);
Object.freeze(ACCESS);

//--------------------

function addTypeTest (name, statMethod, statMethodAsync) {
    const prop = '_' + name;

    statMethod = statMethod || 'stat';
    statMethodAsync = statMethodAsync || 'getStat';
    proto[prop] = null;

    proto['get' + name[0].toUpperCase() + name.substr(1)] = function () {
        let value = this[prop];

        if (value !== null) {
            return Promise.resolve(value);
        }

        return this[statMethodAsync](true).then(stat => {
            return this[prop] = (stat ? stat[name]() : false);
        });
    };

    return proto[name] = function () {
        let value = this[prop];

        if (value === null) {
            let stat = this[statMethod](true);

            this[prop] = value = (stat ? stat[name]() : false);
        }

        return value;
    };
}

addTypeTest('isSymbolicLink', 'statLink');

[
    'isBlockDevice', 'isCharacterDevice', 'isDirectory', 'isFile', 'isFIFO',
    'isSocket'
].forEach(fn => addTypeTest(fn));

proto.isDir = proto.isDirectory;
proto.isSymLink = proto.isSymbolicLink;
proto.getIsSymLink = proto.getIsSymbolicLink;

//------------------------------------------------------------

const dateParts = [
    'birthtime',
    'atime',
    'mtime'
];

//              attrib    ctime  atime  mtime  size   name
//              [1]       [2]    [3]    [4]    [5]    [6]
re.statLine = /^([A-Z]+)\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t(.+)$/;

class Win {
    static dir (path) {
        let lines = this.run('dir', path);

        return Win.parseStats(lines);
    }

    static parseStat (text) {
        let parts = re.statLine.exec(text);
        let stat = parts && new Fs.Stats();

        if (parts) {
            for (let i = 0; i < dateParts.length; ++i) {
                let d = new Date();

                d.setTime(+parts[i + 2] * 1000); // millisec

                stat[dateParts[i]] = d;
            }

            stat.nlink = 1;
            stat.ino = stat.uid = stat.gid = stat.rdev = 0;

            stat.attribs = parts[1];
            stat.ctime = stat.mtime;  // no ctime on Windows
            stat.path = parts[6];
            stat.size = +parts[5];
        }
/*
 dev: -760113522,
  mode: 16822,
  blksize: undefined,
  size: 0,
  blocks: undefined,
 */
        return stat;
    }

    static parseStats (lines) {
        let content = lines.filter(line => !!line);
        return content.map(Win.parseStat);
    }

    static run (...args) {
        return Win.spawn(Win.exe, ...args);
    }

    static spawn (cmd, ...args) {
        var process = ChildProcess.spawnSync(cmd, args, { encoding: 'utf8' });

        if (process.error) {
            throw process.error;
        }

        if (process.status) {
            throw new Error(`Failed to perform "${args.join(" ")}" (code ${process.exitCode})`);
        }

        let lines = process.stdout.toString().trim();

        return lines ? lines.split('\r\n') : [];
    }
}

class WinAsync extends Win {
    static dir (path) {
        return this.run('dir', path).then(lines => Win.parseStats(lines));
    }

    static spawn (cmd, ...args) {
        return new Promise(resolve => {
            var lines = '';
            var process = ChildProcess.spawn(cmd, args, { encoding: 'utf8' });

            process.stdout.on('data', data => {
                lines += data.toString();
                console.log('data:', data);
            });

            process.on('error', function(err) {
                console.log('error', err);
            });
            process.on('exit', function(err) {
                console.log('exit', err);
            });

            process.on('close', (code, signal) => {
                console.log(`${cmd} ${args.join(" ")}:`, lines, ` (exit ${process.exitCode})`);
                if (process.exitCode) {
                    reject(new Error(`Failed to perform "${args.join(" ")}" (code ${process.exitCode})`));
                }
                else {
                    resolve(lines.trim().split('\r\n'));
                }
            });
        });
    }
}

if (File.WIN) {
    Win.exe = Path.resolve(__dirname, 'bin/phylo.exe');

    File.Win = Win;
    File.WinAsync = WinAsync;

    console.log(`File.Win.exe = ${Win.exe}`);
}

//------------------------------------------------------------

module.exports = File;

//------------------------------------------------------------

var f = File.cwd();

console.log(`home: ${File.home()}`);
console.log(`profile: ${File.profile('Acme')}`);

console.log('dir:', Win.dir(f.path));

console.log(f);
console.log(f.exists());
console.log(f.access().name);
console.log(f.stat());

f = f.whereDir('.git');
console.log('Where is .git: ', f);
console.log(File.exists(f));
console.log(File.access(f));

//console.log('The stat: ', f.stat());
console.log(`is: file=${File.isFile(f)} dir=${File.isDirectory(f)}`);
