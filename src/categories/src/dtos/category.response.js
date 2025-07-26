class CategoryResponse {
    constructor(data) {
        this.id = data._id;
        this.version = data.version;
        this.createdAt = data.createdAt;
        this.lastModifiedAt = data.lastModifiedAt;
        this.name = data.name;
        this.slug = data.slug;
        this.createdBy = data.createdBy?.clientId;
        this.lastModifiedBy = data.lastModifiedBy?.clientId;
    }
};

module.exports = CategoryResponse;