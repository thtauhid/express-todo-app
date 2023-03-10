"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static async getTodos() {
      return this.findAll();
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({ title, dueDate, userId, completed: false });
    }

    static async overDue(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toISOString(),
          },
          userId,
          completed: false,
        },
      });
    }
    static async dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toISOString(),
          },
          userId,
          completed: false,
        },
      });
    }
    static async dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toISOString(),
          },
          userId,
          completed: false,
        },
      });
    }

    static async completedItems(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
        },
      });
    }

    static async remove(id, userId) {
      const todo = await this.findByPk(id);
      if (todo.userId !== userId) throw new Error("Unauthorized");

      return this.destroy({
        where: { id, userId },
      });
    }

    setCompletionStatus(completed, userId) {
      if (this.userId !== userId) throw new Error("Unauthorized");
      return this.update({ completed });
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Title is required.",
          },
          len: {
            args: [5],
            msg: "Title must be at least 5 characters long.",
          },
        },
      },
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
