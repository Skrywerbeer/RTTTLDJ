export default class RTTTLRepository {
  constructor() {

  }
  async getFileListAsync() {
    let listPromise;
    await fetch("./assets/tunes/fileList.txt")
        .then((response) => {
          listPromise = response.text()
        })
        .catch(() => {
          throw new Error("failed to fetch fileList.txt");
        });
    return listPromise;
  }
  async getFileTextAsync(filename) {
    let textPromise;
    await fetch(filename)
        .then((response) => {
           textPromise = response.text();
        })
        .catch(() => {
          throw new Error(`Failed to fetch ${filename}`);
        });
    return textPromise;
  }
}