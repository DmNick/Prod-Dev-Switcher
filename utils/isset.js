const isset = (value) => {
    return (value !== undefined && value !== null && value !== "") && value ? value : null;
};

export default isset;