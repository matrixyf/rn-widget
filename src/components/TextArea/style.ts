
/*
 * @Author: Hong.Zhang
 * @Date: 2021-11-02 15:55:49
 * @Description: 
 */
import { StyleSheet } from "react-native";
import { Colors, TypeFaces } from "../../theme";

export default StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    ...TypeFaces.body1,
    width: "100%",
    height: 120,
    paddingHorizontal: 16,
    paddingVertical:12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: 3,
    textAlignVertical: "top",
  },
  focused: {
    borderColor: Colors.primary,
  },
  blur: {
    borderColor: Colors.fog,
  },
  success: {
  },
  error: {
    borderColor: Colors.red,
  },
  warning: {
    borderColor: Colors.yellow,
  },
  disabled: {
    backgroundColor: Colors.ice,
  },
  enabled: {
    backgroundColor: Colors.white,
  },
  bottomContainer: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  invalid: {
    ...TypeFaces.body2,
    color: Colors.red,
    flex: 1,
  },
  count: {
    ...TypeFaces.body2,
    color: Colors.grantie,
  },
})