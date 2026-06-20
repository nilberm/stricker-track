"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressQueryDto = exports.ChangeQuantityDto = exports.SetQuantityDto = exports.ListUserStickersDto = exports.PersonalStickerStatus = void 0;
var database_1 = require("@sticker-track/database");
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var locale_query_dto_1 = require("../../collections/dto/locale-query.dto");
var list_stickers_dto_1 = require("../../collections/dto/list-stickers.dto");
var PersonalStickerStatus;
(function (PersonalStickerStatus) {
    PersonalStickerStatus["ALL"] = "all";
    PersonalStickerStatus["OWNED"] = "owned";
    PersonalStickerStatus["MISSING"] = "missing";
    PersonalStickerStatus["DUPLICATES"] = "duplicates";
})(PersonalStickerStatus || (exports.PersonalStickerStatus = PersonalStickerStatus = {}));
var ListUserStickersDto = function () {
    var _a;
    var _classSuper = locale_query_dto_1.LocaleQueryDto;
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _sectionId_decorators;
    var _sectionId_initializers = [];
    var _sectionId_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _search_decorators;
    var _search_initializers = [];
    var _search_extraInitializers = [];
    var _sort_decorators;
    var _sort_initializers = [];
    var _sort_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ListUserStickersDto, _super);
            function ListUserStickersDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.status = __runInitializers(_this, _status_initializers, PersonalStickerStatus.ALL);
                _this.sectionId = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _sectionId_initializers, void 0));
                _this.type = (__runInitializers(_this, _sectionId_extraInitializers), __runInitializers(_this, _type_initializers, void 0));
                _this.search = (__runInitializers(_this, _type_extraInitializers), __runInitializers(_this, _search_initializers, void 0));
                _this.sort = (__runInitializers(_this, _search_extraInitializers), __runInitializers(_this, _sort_initializers, list_stickers_dto_1.StickerSort.ALBUM_ORDER));
                _this.page = (__runInitializers(_this, _sort_extraInitializers), __runInitializers(_this, _page_initializers, 1));
                _this.limit = (__runInitializers(_this, _page_extraInitializers), __runInitializers(_this, _limit_initializers, 24));
                __runInitializers(_this, _limit_extraInitializers);
                return _this;
            }
            return ListUserStickersDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _status_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(PersonalStickerStatus)];
            _sectionId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _type_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(database_1.StickerType)];
            _search_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_transformer_1.Transform)(function (_b) {
                    var value = _b.value;
                    return typeof value === 'string' ? value.trim() : value;
                })];
            _sort_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(list_stickers_dto_1.StickerSort)];
            _page_decorators = [(0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _limit_decorators = [(0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _sectionId_decorators, { kind: "field", name: "sectionId", static: false, private: false, access: { has: function (obj) { return "sectionId" in obj; }, get: function (obj) { return obj.sectionId; }, set: function (obj, value) { obj.sectionId = value; } }, metadata: _metadata }, _sectionId_initializers, _sectionId_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _search_decorators, { kind: "field", name: "search", static: false, private: false, access: { has: function (obj) { return "search" in obj; }, get: function (obj) { return obj.search; }, set: function (obj, value) { obj.search = value; } }, metadata: _metadata }, _search_initializers, _search_extraInitializers);
            __esDecorate(null, null, _sort_decorators, { kind: "field", name: "sort", static: false, private: false, access: { has: function (obj) { return "sort" in obj; }, get: function (obj) { return obj.sort; }, set: function (obj, value) { obj.sort = value; } }, metadata: _metadata }, _sort_initializers, _sort_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ListUserStickersDto = ListUserStickersDto;
var SetQuantityDto = function () {
    var _a;
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SetQuantityDto() {
                this.quantity = __runInitializers(this, _quantity_initializers, void 0);
                __runInitializers(this, _quantity_extraInitializers);
            }
            return SetQuantityDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _quantity_decorators = [(0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(999)];
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.SetQuantityDto = SetQuantityDto;
var ChangeQuantityDto = function () {
    var _a;
    var _amount_decorators;
    var _amount_initializers = [];
    var _amount_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ChangeQuantityDto() {
                this.amount = __runInitializers(this, _amount_initializers, 1);
                __runInitializers(this, _amount_extraInitializers);
            }
            return ChangeQuantityDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _amount_decorators = [(0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(999)];
            __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: function (obj) { return "amount" in obj; }, get: function (obj) { return obj.amount; }, set: function (obj, value) { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _amount_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ChangeQuantityDto = ChangeQuantityDto;
var ProgressQueryDto = function () {
    var _a;
    var _classSuper = locale_query_dto_1.LocaleQueryDto;
    var _view_decorators;
    var _view_initializers = [];
    var _view_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ProgressQueryDto, _super);
            function ProgressQueryDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.view = __runInitializers(_this, _view_initializers, void 0);
                __runInitializers(_this, _view_extraInitializers);
                return _this;
            }
            return ProgressQueryDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _view_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['summary'])];
            __esDecorate(null, null, _view_decorators, { kind: "field", name: "view", static: false, private: false, access: { has: function (obj) { return "view" in obj; }, get: function (obj) { return obj.view; }, set: function (obj, value) { obj.view = value; } }, metadata: _metadata }, _view_initializers, _view_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ProgressQueryDto = ProgressQueryDto;
