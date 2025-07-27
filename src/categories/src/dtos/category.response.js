class CategoryResponse {
    constructor(data) {
        this.id = data._id;
        this.version = data.version;
        this.createdAt = data.createdAt;
        this.lastModifiedAt = data.lastModifiedAt;
        this.name = data.name;
        this.slug = data.slug;
        this.createdBy = {
            clientId: data.createdBy?.clientId,
            isPlatformClient: data.createdBy?.isPlatformClient
        };
        this.lastModifiedBy = {
            clientId: data.lastModifiedBy?.clientId,
            isPlatformClient: data.lastModifiedBy?.isPlatformClient
        };
    }
};

module.exports = CategoryResponse;