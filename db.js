const fs = require("fs");
const initSqlJs = require("sql.js");

module.exports = class Db {
    data = null;
    file = null;

    constructor(file) {
        this.file = file;
    }

    async open(model = "./sql/model.sql") {
        const SQL = await initSqlJs({
            locateFile: () => "./sql/sql-wasm.wasm"
        });

        if (fs.existsSync(this.file)) {
            const filebuffer = fs.readFileSync(this.file);
            this.data = new SQL.Database(filebuffer);
        } else {
            this.data = new SQL.Database();
            const migration = fs.readFileSync(model, { encoding: "utf-8" });
            this.data.exec(migration);
        }
    }

    save() {
        const serialized = this.data.export();
        const buffer = Buffer.from(serialized);
        fs.writeFileSync(this.file, buffer);
    }

    close() {
        this.data.close();
    }
};
